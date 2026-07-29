'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';

declare global {
    interface Window { faceapi: any; }
}

export default function FaceRegister({ userRole, onSkip }: { userRole: string, onSkip: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'scanning' | 'done' | 'error'>('loading');
    const [message, setMessage] = useState('Loading face recognition…');
    const { api, toast } = useApp();
    const router = useRouter();
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const loadModels = async () => {
            if (typeof window === 'undefined') return;

            if (!window.faceapi) {
                await new Promise<void>((res, rej) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
                    s.onload = () => res(); s.onerror = () => rej(new Error('Failed to load face-api.js'));
                    document.head.appendChild(s);
                });
            }

            const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
            try {
                await Promise.all([
                    window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    window.faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
                    window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setMessage('Camera starting…');
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
                streamRef.current = stream;
                if (videoRef.current) { videoRef.current.srcObject = stream; }
                setStatus('ready');
                setMessage('Position your face and click Register');
            } catch (err: any) {
                setStatus('error'); setMessage(err.message || 'Camera error');
            }
        };
        loadModels();
        return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
    }, []);

    const handleScan = async () => {
        if (!videoRef.current || !window.faceapi) return;
        setStatus('scanning'); setMessage('Scanning…');
        try {
            const detection = await window.faceapi
                .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks(true)
                .withFaceDescriptor();

            if (!detection) { setStatus('ready'); setMessage('No face detected. Try again.'); return; }

            const descriptor = Array.from(detection.descriptor as Float32Array);
            await api.post('/auth/register-face', { descriptor });

            setStatus('done'); setMessage('Face registered successfully');
            toast('Face ID enabled', 'success');
            streamRef.current?.getTracks().forEach(t => t.stop());

            setTimeout(() => {
                if (userRole === 'seller') {
                    router.replace('/dashboard');
                } else {
                    router.replace('/shop');
                }
            }, 1000);
        } catch (err: any) {
            setStatus('ready'); setMessage(err?.response?.data?.message || 'Registration failed. Try again.');
            toast('Face registration failed', 'error');
        }
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '6px', fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>Register Face ID</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '20px' }}>{message}</p>

            <div style={{ position: 'relative', width: 260, height: 195, margin: '0 auto 20px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: `1.5px solid ${status === 'done' ? 'var(--accent)' : 'var(--border)'}`, background: 'var(--bg-elevated)' }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: status === 'loading' ? 'none' : 'block' }} />
                {status === 'loading' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="spinner" style={{ width: 28, height: 28 }} />
                    </div>
                )}
                {status === 'done' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(31,61,43,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: 'var(--accent)', fontWeight: 600 }}>✓</div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary btn-sm" onClick={onSkip} style={{ flex: 1 }}>Skip</button>
                {status === 'ready' && (
                    <button className="btn btn-primary" onClick={handleScan} style={{ flex: 2 }}>Register Face</button>
                )}
                {status === 'scanning' && (
                    <button className="btn btn-secondary" disabled style={{ flex: 2 }}><span className="spinner" style={{ width: 14, height: 14 }} /> Scanning…</button>
                )}
            </div>

            <p style={{ marginTop: '16px', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2px' }}>
                Face data stored as a mathematical hash — never leaves the system.
            </p>
        </div>
    );
}
