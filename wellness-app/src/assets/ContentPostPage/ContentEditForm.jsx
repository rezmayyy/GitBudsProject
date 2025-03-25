import React from "react";
import TagSelector from "../TagSystem/TagSelector";
import ReactQuill from "react-quill";
import styles from "./ContentEditForm.module.css";

export default function ContentEditForm({
    type, title, description, body, tags,
    onChangeTitle, onChangeDescription, onChangeBody, onChangeTags,
    onSave, onCancel
}) {
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

    return (
        <form className={styles.editForm} onSubmit={e => { e.preventDefault(); onSave(); }}>
            <label>Title</label>
            <input className={styles.input} value={title} onChange={e => onChangeTitle(e.target.value)} />

            <label>Description</label>
            {type === "article" ? (
                <ReactQuill value={body} onChange={onChangeBody} modules={articleModules} theme="snow" />
            ) : (
                <ReactQuill value={description} onChange={onChangeDescription} modules={minimalModules} theme="snow" />
            )}

            <label>Tags</label>
            <TagSelector selectedTags={tags} setSelectedTags={onChangeTags} />

            <div className={styles.actions}>
                <button type="submit" className={styles.save}>Save Changes</button>
                <button type="button" className={styles.cancel} onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
}
