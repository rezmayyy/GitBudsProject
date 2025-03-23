import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function ConfirmEmailChange() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const functions = getFunctions();
    const confirmFn = httpsCallable(functions, 'confirmEmailChange');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) return navigate('/');
        confirmFn({ token })
            .then(res => alert(res.data.message))
            .catch(err => alert(err.message))
            .finally(() => navigate('/profile'));
    }, []);

    return <p>Verifying…</p>;
}

