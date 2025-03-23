import React, { useState, useContext } from 'react';
import UserContext from './UserContext';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import styles from '../styles/account.module.css';

const tabs = [
    { key: 'changeDisplayName', label: 'Change Display Name' },
    { key: 'changePassword', label: 'Change Password' },
    { key: 'changeEmail', label: 'Change Email' },
    { key: 'applyToBeHealer', label: 'Apply to Be a Healer' },
    { key: 'deleteAccount', label: 'Delete Account' },
];

export default function Account() {
    const { user } = useContext(UserContext);
    const [activeTab, setActiveTab] = useState('changeDisplayName');
    const [formValues, setFormValues] = useState({});
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [message, setMessage] = useState('');

    const functions = getFunctions();
    if (process.env.REACT_APP_USE_EMULATOR === 'true') {
        connectFunctionsEmulator(functions, 'localhost', 5001);
    }

    const callFn = (name, payload) => httpsCallable(functions, name)(payload);

    const handleSubmit = async () => {
        setMessage('');
        try {
            let response;
            if (activeTab === 'changePassword') {
                response = await callFn('changePassword', { newPassword: formValues.newPassword });
            } else if (activeTab === 'changeEmail') {
                response = await callFn('requestEmailChange', { newEmail: formValues.newEmail });
            } else if (activeTab === 'deleteAccount') {
                response = await callFn('deleteAccount', {});
            } else {
                response = await callFn(activeTab, { newDisplayName: formValues.newDisplayName });
            }
            setMessage(response.data.message || 'Success');
            setFormValues({});
        } catch (err) {
            setMessage(err.message);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'changePassword':
                return (
                    <>
                        <input type="password" placeholder="Current Password" value={formValues.currentPassword || ''} onChange={e => setFormValues({ ...formValues, currentPassword: e.target.value })} />
                        <input type="password" placeholder="New Password" value={formValues.newPassword || ''} onChange={e => setFormValues({ ...formValues, newPassword: e.target.value })} />
                        <input type="password" placeholder="Confirm New Password" value={formValues.confirmPassword || ''} onChange={e => setFormValues({ ...formValues, confirmPassword: e.target.value })} />
                        <button onClick={handleSubmit}>Save</button>
                    </>
                );

            case 'changeEmail':
                return (
                    <>
                        <input type="email" placeholder="New Email" value={formValues.newEmail || ''} onChange={e => setFormValues({ ...formValues, newEmail: e.target.value })} />
                        <button onClick={handleSubmit}>Send Confirmation Link</button>
                    </>
                );

            case 'deleteAccount':
                return confirmDelete
                    ? <>
                        <p>Confirm delete?</p>
                        <button onClick={handleSubmit}>Confirm</button>
                        <button onClick={() => setConfirmDelete(false)}>Cancel</button>
                    </>
                    : <button onClick={() => setConfirmDelete(true)}>Delete Account</button>;

            default:
                return (
                    <>
                        <input placeholder="Value" value={formValues.newDisplayName || ''} onChange={e => setFormValues({ ...formValues, newDisplayName: e.target.value })} />
                        <button onClick={handleSubmit}>Save</button>
                    </>
                );
        }
    };

    if (!user) return <p>Please log in.</p>;

    return (
        <div className={styles.dashboardContainer}>
            <aside className={styles.sidebar}>
                {tabs.map(tab => (
                    <button key={tab.key} className={`${styles.sidebarButton} ${activeTab === tab.key ? styles.active : ''}`} onClick={() => { setActiveTab(tab.key); setMessage(''); setFormValues({}); }}>
                        {tab.label}
                    </button>
                ))}
            </aside>
            <main className={styles.contentWrapper}>
                <div className={styles.manageModuleContainer}>
                    <h2 className={styles.postTitle}>{tabs.find(t => t.key === activeTab).label}</h2>
                    {renderContent()}
                    {message && <p className={styles.message}>{message}</p>}
                </div>
            </main>
        </div>
    );
}
