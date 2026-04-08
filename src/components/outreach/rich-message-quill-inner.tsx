"use client";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
];

export default function RichMessageQuillInner({
  value,
  onChange,
  disabled,
  id,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <ReactQuill
      id={id}
      theme="snow"
      value={value}
      onChange={onChange}
      modules={MODULES}
      formats={FORMATS}
      readOnly={disabled}
      className="bg-white rounded-lg [&_.ql-editor]:min-h-[280px] [&_.ql-container]:border-outline-variant/30 [&_.ql-toolbar]:border-outline-variant/30 [&_.ql-toolbar]:rounded-t-lg"
      placeholder="Write your message. Use Insert tokens below; they are sent as plain merge fields."
    />
  );
}
