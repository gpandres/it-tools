"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "cn";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ToolActionButton } from "@/components/tool-action-panel";

export type ToolDialogAction = {
  label: React.ReactNode;
  onSelect?: () => void;
  tone?: "neutral" | "accent" | "danger";
  closeOnSelect?: boolean;
  disabled?: boolean;
};

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-3xl",
  xl: "sm:max-w-5xl",
} as const;

export function ToolDialog({
  trigger,
  title,
  description,
  icon: Icon,
  children,
  actions = [],
  cancelLabel = "Cancel",
  footer,
  size = "md",
  open,
  defaultOpen,
  onOpenChange,
  contentClassName,
}: {
  trigger?: React.ReactElement;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children?: React.ReactNode;
  actions?: ToolDialogAction[];
  cancelLabel?: React.ReactNode | false;
  footer?: React.ReactNode;
  size?: keyof typeof sizeClasses;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentClassName?: string;
}) {
  return <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
    {trigger && <DialogTrigger render={trigger} />}
    <DialogContent
      showCloseButton={false}
      className={cn(
        "max-h-[min(42rem,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-none border border-[#2a2a2a] bg-[#080808] p-0 text-zinc-100 shadow-2xl",
        sizeClasses[size],
        contentClassName,
      )}
    >
      <DialogHeader className="relative gap-1 border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 pr-12">
        <DialogTitle className="flex items-center gap-2 text-xs font-bold uppercase leading-normal tracking-widest text-[#ffb000]">
          {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden={true} />}
          {title}
        </DialogTitle>
        {description && <DialogDescription className="text-[10px] leading-relaxed text-zinc-400">{description}</DialogDescription>}
        <DialogClose
          aria-label="Close dialog"
          className="absolute right-3 top-3 grid size-8 place-items-center border border-transparent text-zinc-400 hover:border-[#2a2a2a] hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </DialogClose>
      </DialogHeader>
      <div className="min-h-0 overflow-y-auto p-4">{children}</div>
      {(cancelLabel !== false || actions.length > 0 || footer) && <footer className="flex flex-wrap justify-end gap-2 border-t border-[#1a1a1a] bg-[#050505] px-4 py-3">
        {footer}
        {cancelLabel !== false && <DialogClose render={<ToolActionButton className="rounded-none" tone="neutral" />}>
          {cancelLabel}
        </DialogClose>}
        {actions.map((action, index) => {
          const button = <ToolActionButton
            className="rounded-none"
            tone={action.tone ?? "accent"}
            disabled={action.disabled}
            onClick={action.onSelect}
          >
            {action.label}
          </ToolActionButton>;
          return action.closeOnSelect === false
            ? <React.Fragment key={index}>{button}</React.Fragment>
            : <DialogClose key={index} render={button} />;
        })}
      </footer>}
    </DialogContent>
  </Dialog>;
}

export function ToolConfirmDialog({ trigger, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "danger", onConfirm }: {
  trigger: React.ReactElement;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  tone?: "accent" | "danger";
  onConfirm: () => void;
}) {
  return <ToolDialog
    trigger={trigger}
    title={title}
    description={description}
    cancelLabel={cancelLabel}
    actions={[{ label: confirmLabel, tone, onSelect: onConfirm }]}
    size="sm"
  >
    <p className="text-xs leading-relaxed text-zinc-400">This action requires explicit confirmation.</p>
  </ToolDialog>;
}
