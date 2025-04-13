import React, { useContext, useRef, useState, useEffect } from "react";
import TagSelector from "../TagSystem/TagSelector";
import ReactQuill from "react-quill";
import styles from "./ContentEditForm.module.css";
import UserContext from "../UserContext";
import { validateFile, uploadFileToStorage } from "../../Utils/fileUtils";
import { httpsCallable } from "firebase/functions";
import { functions } from "../Firebase";

export default function ContentEditForm({
    type,
    title,
    description,
    body,
    tags,
    onChangeTitle,
    onChangeDescription,
    onChangeBody,
    onChangeTags,
    onSave,
    onCancel
}) {
    const { user } = useContext(UserContext);
    const quillRef = useRef(null);
    const [quillInstance, setQuillInstance] = useState(null);
    console.log("type is =>", type); // should be "article" when editing an article

    // Define modules without image handler.
    const articleModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"]
        ]
    };

    const minimalModules = {
        toolbar: [["bold", "italic"], ["link"], ["clean"]]
    };

    // Custom image upload handler.
    const handleQuillImageUpload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.setAttribute("accept", "image/jpeg,image/png,image/bmp");
        input.click();

        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];

                // 1. Validate file clientside.
                const isValid = await validateFile(file, "image");
                if (!isValid) return;

                // 2. Upload the file to a temporary folder (temp/{user.uid}).
                const tempFolder = `temp/${user.uid}`;
                const tempFilePath = await uploadFileToStorage(file, tempFolder);
                if (!tempFilePath) {
                    alert("Image upload failed.");
                    return;
                }

                try {
                    // 3. Call the Firebase function to process and move the image.
                    const moveArticleImage = httpsCallable(functions, "moveArticleImage");
                    const result = await moveArticleImage({ filePath: tempFilePath });
                    const finalUrl = result.data.imageUrl;
                    if (!finalUrl) throw new Error("No URL returned from function");

                    // 4. Use the Quill editor API to insert the image.
                    const editor = quillRef.current.getEditor();
                    const range = editor.getSelection();
                    const position = range ? range.index : editor.getLength();
                    editor.insertEmbed(position, "image", finalUrl);
                    editor.setSelection(position + 1);

                    // 5. Update parent's state with the current content.
                    onChangeBody(editor.root.innerHTML);
                } catch (error) {
                    console.error("Error processing image:", error);
                    alert("Server-side image processing failed.");
                }
            }
        };
    };


    // When the editor instance is set, attach the image handler to the toolbar.
    useEffect(() => {
        if (quillInstance) {
            const toolbar = quillInstance.getModule("toolbar");
            if (toolbar) {
                toolbar.addHandler("image", handleQuillImageUpload);
            }
        }
    }, [quillInstance]);

    // Initialize quillInstance after mount.
    useEffect(() => {
        if (!quillInstance && quillRef.current) {
            setQuillInstance(quillRef.current.getEditor());
        }
    }, [quillInstance]);

    return (
        <form
            className={styles.editForm}
            onSubmit={e => {
                e.preventDefault();
                onSave();
            }}
        >
            <label>Title</label>
            <input
                className={styles.input}
                value={title}
                onChange={e => onChangeTitle(e.target.value)}
            />

            <label>Description</label>
            {type === "article" ? (
                <ReactQuill
                    ref={quillRef}
                    value={body || ""}
                    onChange={(content, delta, source, editor) => {
                        onChangeBody(editor.getHTML());
                    }}
                    modules={articleModules}
                    theme="snow"
                    onChangeSelection={() => {
                        if (!quillInstance && quillRef.current) {
                            setQuillInstance(quillRef.current.getEditor());
                        }
                    }}
                />
            ) : (
                <ReactQuill
                    value={description || ""}
                    onChange={onChangeDescription}
                    modules={minimalModules}
                    theme="snow"
                />
            )}

            <label>Tags</label>
            <TagSelector selectedTags={tags} setSelectedTags={onChangeTags} />

            <div className={styles.actions}>
                <button type="submit" className={styles.save}>
                    Save Changes
                </button>
                <button type="button" className={styles.cancel} onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </form>
    );
}
