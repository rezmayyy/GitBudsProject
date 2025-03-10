import React, { useState, useContext } from 'react';
import { db } from '../Firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import UserContext from '../UserContext';
import './ApplyForHealer.css';

const availableTags = [
    "Chakra Healing", "Meditation", "Reiki", "Theta Healing", "Energy Healing",
    "Spiritual Counseling", "Animal Reiki", "Meditation Techniques", "Mental Health",
    "Crystal Therapy", "Sound Bath", "Depression", "Anxiety"
];

function HealerApplicationForm() {
    const { user } = useContext(UserContext);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        title: '',
        location: '',
        healingTags: [],
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTagSelection = (tag) => {
        setFormData(prev => {
            let updatedTags = [...prev.healingTags];

            if (updatedTags.includes(tag)) {
                updatedTags = updatedTags.filter(t => t !== tag);
            } else if (updatedTags.length < 5) {
                updatedTags.push(tag);
            }

            return { ...prev, healingTags: updatedTags };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Check if user is already an approved healer
            const healersRef = collection(db, 'healers');
            const healerQuery = query(healersRef, where('userId', '==', user.uid));
            const healerSnapshot = await getDocs(healerQuery);

            if (!healerSnapshot.empty) {
                alert('You are already an approved healer and cannot reapply.');
                setSubmitting(false);
                return;
            }

            // Check if user has a pending or rejected application
            const applicationsRef = collection(db, 'healerApplications');
            const applicationQuery = query(applicationsRef, where('userId', '==', user.uid));
            const applicationSnapshot = await getDocs(applicationQuery);

            if (!applicationSnapshot.empty) {
                const existingApplication = applicationSnapshot.docs[0];
                const existingData = existingApplication.data();

                if (existingData.status === 'pending') {
                    alert('You have already submitted an application. Please wait for approval.');
                    setSubmitting(false);
                    return;
                } else if (existingData.status === 'rejected') {
                    // Delete previous rejected application before submitting a new one
                    await deleteDoc(existingApplication.ref);
                }
            }

            // Fetch the user's profile picture URL from the users collection
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            let profilePicUrl = null;
            if (userDoc.exists()) {
                const userData = userDoc.data();
                profilePicUrl = userData.profilePicUrl;
            }

            // Submit a new healer application with profilePicUrl
            const healerApplication = {
                ...formData,
                userId: user.uid,
                displayName: user.displayName,
                profilePicUrl: profilePicUrl, // Include the profilePicUrl
                status: 'pending',
                createdAt: Timestamp.now()
            };

            // Add the application to the 'healerApplications' collection
            await addDoc(collection(db, 'healerApplications'), healerApplication);

            // Reset form data and alert success
            setFormData({ firstName: '', lastName: '', title: '', location: '', healingTags: [] });
            alert('Application submitted successfully!');
        } catch (error) {
            console.error('Error submitting application:', error);
            alert('Failed to submit application. Please try again.');
        }

        setSubmitting(false);
    };

    return (
        <div className="healer-form">
            <h2>Apply to Become a Healer</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} maxLength={50} required />
                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} maxLength={50} required />
                <input type="text" name="title" placeholder="Title (e.g., Healing Master)" value={formData.title} onChange={handleChange} maxLength={100} required />
                <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} maxLength={100} required />
                
                <div>
                    <p>Select up to 5 Healing Focus Tags:</p>
                    <div className="tag-selection">
                        {availableTags.map(tag => (
                            <label key={tag} className={`tag ${formData.healingTags.includes(tag) ? 'selected' : ''}`}>
                                <input 
                                    type="checkbox" 
                                    checked={formData.healingTags.includes(tag)} 
                                    onChange={() => handleTagSelection(tag)}
                                />
                                {tag}
                            </label>
                        ))}
                    </div>
                </div>

                <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</button>
            </form>
        </div>
    );
}

export default HealerApplicationForm;
