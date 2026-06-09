"use client";

import { useState } from "react";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import StickyNoteCanvas from "./canvas";

export default function StickyNotePage() {
	const [isDebug, setIsDebug] = useState(false);
	const [resetKey, setResetKey] = useState(0);

	return (
		<LabPageLayout
			title="Sticky Note"
			sidebar={
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between gap-3">
						<label
							htmlFor="sticky-note-debug"
							className="text-sm text-muted-foreground"
						>
							Debug
						</label>
						<Switch
							id="sticky-note-debug"
							checked={isDebug}
							onCheckedChange={setIsDebug}
						/>
					</div>
					<Button
						type="button"
						variant="outline"
						onClick={() => setResetKey((key) => key + 1)}
					>
						Reset
					</Button>
				</div>
			}
		>
			<StickyNoteCanvas isDebug={isDebug} resetKey={resetKey} />
		</LabPageLayout>
	);
}
