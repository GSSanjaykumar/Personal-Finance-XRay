import { useState, useRef } from "react";
import { uploadStatement } from "../api/financeApi";
import { useToast } from "../components/v0-ui/toast";

export function useStatementUpload({ onSuccess } = {}) {
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e, autoUpload = false) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) {
            toast({ tone: "warning", title: "Invalid File", description: "Please select a PDF bank statement." });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        
        setSelectedFile(file);
        
        if (autoUpload) {
            handleUpload(file);
        }
        
        return file;
    };

    const handleUpload = async (fileToUpload = selectedFile) => {
        if (!fileToUpload) return;
        
        setIsUploading(true);
        try {
            const data = await uploadStatement(fileToUpload);
            toast({ 
                tone: "success", 
                title: "Statement uploaded successfully", 
                description: `${data.transactions?.length || 0} transactions imported successfully.` 
            });
            setSelectedFile(null);
            if (onSuccess) onSuccess();
        } catch (err) {
            if (err.response?.status === 409) {
                toast({ tone: "warning", title: "Duplicate Statement", description: "This statement has already been imported." });
            } else if (err.response?.status === 400) {
                toast({ tone: "error", title: "Unsupported Statement", description: "Finance X-Ray couldn't extract transactions from this statement." });
            } else {
                toast({ tone: "error", title: "Upload Failed", description: "An error occurred while uploading the statement." });
            }
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const resetSelection = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return {
        selectedFile,
        isUploading,
        fileInputRef,
        handleFileSelect,
        handleUpload,
        resetSelection
    };
}
