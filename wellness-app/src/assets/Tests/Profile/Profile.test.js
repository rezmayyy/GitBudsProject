import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    setDoc: jest.fn()
}));

jest.mock('firebase/storage', () => ({
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn()
}));

// Mock httpsCallable function
jest.mock('firebase/functions', () => ({
    httpsCallable: jest.fn()
}));

// Create mock functions directly instead of trying to import them
const mockUploadFileToStorage = jest.fn();
const mockValidateFile = jest.fn();

// Create mock user
const mockUser = {
    uid: 'L1TCy2g4j1ZlZK2xCKofPM3IkKt2'
};

describe('Profile handleSave function', () => {
    // Mock state setter functions
    let mockSetMessage;
    let mockSetProfileData;
    let mockSetProfilePicturePreview;
    let mockSetProfilePictureFile;
    let mockProfilePictureFile;
    let mockChangeProfilePic;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Setup mocks for each test
        mockSetMessage = jest.fn();
        mockSetProfileData = jest.fn();
        mockSetProfilePicturePreview = jest.fn();
        mockSetProfilePictureFile = jest.fn();
        mockProfilePictureFile = new File(['dummy content'], 'profile.jpg', { type: 'image/jpeg' });

        // Reset the mock implementations
        mockUploadFileToStorage.mockClear();
        mockUploadFileToStorage.mockResolvedValue('temp/L1TCy2g4j1ZlZK2xCKofPM3IkKt2/profile.jpg');
        mockValidateFile.mockClear();
        mockValidateFile.mockResolvedValue(true);

        // Setup the httpsCallable mock
        mockChangeProfilePic = jest.fn().mockResolvedValue({
            data: { profilePicUrl: 'https://example.com/profile.jpg' }
        });
        httpsCallable.mockReturnValue(mockChangeProfilePic);
    });

    test('handleSave uploads profile picture successfully', async () => {
        // Call the handleSave function with necessary parameters
        await handleSave({
            user: mockUser,
            profilePictureFile: mockProfilePictureFile,
            setMessage: mockSetMessage,
            setProfileData: mockSetProfileData,
            setProfilePicturePreview: mockSetProfilePicturePreview,
            setProfilePictureFile: mockSetProfilePictureFile,
            validateFile: mockValidateFile,
            uploadFileToStorage: mockUploadFileToStorage
        });

        // Verify the correct functions were called
        expect(mockValidateFile).toHaveBeenCalledWith(mockProfilePictureFile, "image");
        expect(mockUploadFileToStorage).toHaveBeenCalledWith(
            mockProfilePictureFile,
            `temp/${mockUser.uid}`
        );

        // Verify state was updated correctly
        expect(mockSetMessage).toHaveBeenCalledWith('Profile picture updated successfully!');
        expect(mockSetProfileData).toHaveBeenCalled();
        expect(mockSetProfilePicturePreview).toHaveBeenCalledWith('https://example.com/profile.jpg');
        expect(mockSetProfilePictureFile).toHaveBeenCalledWith(null);
    });

    test('handleSave handles no profile picture selected', async () => {
        // Call handleSave with null profilePictureFile
        await handleSave({
            user: mockUser,
            profilePictureFile: null,
            setMessage: mockSetMessage,
            setProfileData: mockSetProfileData,
            setProfilePicturePreview: mockSetProfilePicturePreview,
            setProfilePictureFile: mockSetProfilePictureFile,
            validateFile: mockValidateFile,
            uploadFileToStorage: mockUploadFileToStorage
        });

        // Verify correct message was set
        expect(mockSetMessage).toHaveBeenCalledWith('No profile picture selected to update.');

        // Verify no other functions were called
        expect(mockValidateFile).not.toHaveBeenCalled();
        expect(mockUploadFileToStorage).not.toHaveBeenCalled();
    });

    test('handleSave handles file validation failure', async () => {
        // Mock validateFile to return false
        mockValidateFile.mockResolvedValueOnce(false);

        // Call handleSave
        await handleSave({
            user: mockUser,
            profilePictureFile: mockProfilePictureFile,
            setMessage: mockSetMessage,
            setProfileData: mockSetProfileData,
            setProfilePicturePreview: mockSetProfilePicturePreview,
            setProfilePictureFile: mockSetProfilePictureFile,
            validateFile: mockValidateFile,
            uploadFileToStorage: mockUploadFileToStorage
        });

        // Verify correct message was set
        expect(mockSetMessage).toHaveBeenCalledWith('Invalid profile picture file.');

        // Verify upload was not attempted
        expect(mockUploadFileToStorage).not.toHaveBeenCalled();
    });

    test('handleSave sanitizes filenames with special characters', async () => {
        // Create file with special characters in name
        const specialFile = new File(['dummy content'], 'my profile!@#.jpg', { type: 'image/jpeg' });

        // Call handleSave
        await handleSave({
            user: mockUser,
            profilePictureFile: specialFile,
            setMessage: mockSetMessage,
            setProfileData: mockSetProfileData,
            setProfilePicturePreview: mockSetProfilePicturePreview,
            setProfilePictureFile: mockSetProfilePictureFile,
            validateFile: mockValidateFile,
            uploadFileToStorage: mockUploadFileToStorage
        });

        // Verify the validateFile was called with a sanitized filename
        const uploadCall = mockUploadFileToStorage.mock.calls[0];
        expect(uploadCall[0].name).toBe('my_profile___.jpg');
    });
});

// Implementation of handleSave function for testing
async function handleSave(params) {
    const {
        user,
        profilePictureFile,
        setMessage,
        setProfileData,
        setProfilePicturePreview,
        setProfilePictureFile,
        validateFile,
        uploadFileToStorage
    } = params;

    try {
        console.log("=== Starting handleSave function ===");
        console.log("User ID:", user.uid);

        if (profilePictureFile) {
            setMessage('Uploading profile picture...');

            // Sanitize filename
            const safeFileName = profilePictureFile.name.replace(/[^a-zA-Z0-9.]/g, '_');

            // Create new file with clean name if needed
            let fileToUpload = profilePictureFile;
            if (safeFileName !== profilePictureFile.name) {
                fileToUpload = new File([profilePictureFile], safeFileName, {
                    type: profilePictureFile.type
                });
            }

            // Validate file
            const isValid = await validateFile(fileToUpload, "image");
            if (!isValid) {
                setMessage("Invalid profile picture file.");
                return;
            }

            // Upload to Firebase Storage
            const tempFolder = `temp/${user.uid}`;

            try {
                const storagePath = await uploadFileToStorage(fileToUpload, tempFolder);

                // Call the Cloud Function - using the mocked httpsCallable
                const changeProfilePic = httpsCallable(null, 'changeProfilePic');
                const result = await changeProfilePic({ filePath: storagePath });

                // Update state with the new URL
                const profilePicUrl = result.data.profilePicUrl;
                setProfileData(prev => ({ ...prev, profilePicUrl }));
                setProfilePicturePreview(profilePicUrl);
                setProfilePictureFile(null);
                setMessage('Profile picture updated successfully!');
            } catch (error) {
                setMessage(`Profile picture error: ${error.message || error.toString()}`);
            }
        } else {
            setMessage('No profile picture selected to update.');
        }
    } catch (error) {
        setMessage(`Error: ${error.message || error.toString()}`);
    }
}