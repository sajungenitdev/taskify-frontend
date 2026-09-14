"use client";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/UI/dialog";
import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Label } from "@/components/UI/label";
import { Textarea } from "@/components/UI/textarea";
import { leadApi } from "@/lib/api/crm.api";
import { toast } from "react-hot-toast";

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    leadId: string;
    defaultName?: string;
    onConverted?: () => void;
}

export function ConvertToProjectModal({
    open,
    onOpenChange,
    leadId,
    defaultName,
    onConverted,
}: Props) {
    const [name, setName] = useState(defaultName ?? "");
    const [code, setCode] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        setSaving(true);
        try {
            await leadApi.convertToProject(leadId, {
                name: name || undefined,
                code: code || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                description: description || undefined,
            });
            toast.success("Project created");
            onConverted?.();
            onOpenChange(false);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Convert to Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div>
                        <Label>Project name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <Label>Code</Label>
                        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PRJ-0001" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Start date</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <Label>End date</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={saving}>
                        {saving ? "Creating..." : "Create project"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
