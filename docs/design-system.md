# IT_TOOLS design system

This document is the visual and interaction contract for the application. It is the source of truth for new tools and for bringing older tools into line. The reference implementation is available at `/design-system`; it is intentionally not registered as a tool, linked from navigation, or included in the sitemap.

The visual baseline is the current `Subnetting Calculator` and `URL Defanger & Safelink Decoder`, not the rounder default treatment of generic component examples. New work should look like those tools: squared panels, thin borders, black input areas, compact terminal labels and restrained spacing. Rounded controls may remain where a shared primitive requires them, but a tool should override them with `rounded-none` when matching this baseline.

## Product character

IT_TOOLS is a local-first professional toolbox for sysadmin, networking, DevOps, blue team and red team work. Its visual language is a restrained terminal/workbench interface:

- dark, near-black surfaces with thin structural borders;
- JetBrains Mono everywhere, with no replacement font per tool;
- phosphor green for active/success/action states;
- amber for the product mark, titles and attention;
- compact uppercase labels with tracking, followed by readable monospace content;
- information density without decoration, gradients, excessive rounded cards or dashboard-style tiles;
- visible keyboard focus and useful text alternatives for every icon-only control.

The interface should feel like one application even when a tool has a complex canvas, report, calculator or simulator.

## Canonical tokens

Use the existing CSS variables where possible. When a component needs an explicit colour, use these values rather than inventing a new shade.

| Role | Token/value | Use |
| --- | --- | --- |
| App background | `#000000` | Page and empty canvas background |
| Shell surface | `#050505` | Header, toolbar, action panel |
| Panel surface | `#080808` / `#0a0a0a` | Tool panels and related-tool cards |
| Control surface | `#111111` | Inputs, selected controls and compact fields |
| Structural border | `#1a1a1a` | Dividers, panel borders, table rules |
| Highlight border | `#2a2a2a` | Hover and secondary emphasis |
| Phosphor | `#00ff9c` / `var(--phosphor)` | Active state, links, success, executable action |
| Phosphor dim | `#1f7a5a` / `var(--phosphor-dim)` | Helper text, inactive decoration |
| Amber | `#ffb000` / `var(--amber)` | Product/tool headings and attention |
| Body text | `#d4d4d8` | Main readable content |
| Muted text | `#71717a` | Descriptions and secondary metadata |
| Error | `#f87171` | Validation failure and destructive feedback |
| Warning | `#fbbf24` | Caution and potentially disruptive actions |
| Info | `#38bdf8` | Neutral information and telemetry context |

Do not use bright white surfaces, purple default gradients, arbitrary one-off accent colours, excessive `rounded-xl` cards, or colour as the only way to communicate state.

## Typography

`src/app/layout.tsx` loads the local JetBrains Mono font and `src/app/globals.css` applies it globally. Do not load a web font or override it in a tool.

Canonical hierarchy:

```tsx
<h1 className="text-sm font-bold uppercase tracking-widest text-[#ffb000] glow-amber">
  / TOOL NAME
</h1>
<p className="mt-1 text-xs text-zinc-500">Short, useful tool description.</p>
<h2 className="text-xs font-bold uppercase tracking-widest text-[#00ff9c]">
  Section label
</h2>
<p className="text-xs leading-relaxed text-zinc-300">Readable content.</p>
<span className="text-[10px] uppercase tracking-widest text-zinc-600">
  Metadata
</span>
```

Keep headings short. Use `truncate` only for one-line labels where the full value is available via `title`; otherwise allow wrapping with `break-words`.

## Page shell

Every registered tool should use `ToolLayout`. It supplies the global header, search, favourite control, local-processing disclosure and related tools.

```tsx
<ToolLayout
  title="TOOL NAME"
  description="What the tool does and what stays local."
  fullWidth={false}
>
  <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
    {/* tool content */}
  </div>
</ToolLayout>
```

Use `fullWidth` only for matrix/canvas experiences that genuinely need the viewport. Tool content must remain `min-w-0`, avoid accidental horizontal overflow, and become a single column on narrow screens.

## Surfaces and spacing

Prefer a small number of structural surfaces. A tool normally has one main surface and optional grouped panels. The default tool surface is square; use rounded corners only when they communicate a real affordance such as a popover or a third-party canvas node:

```tsx
<section className="border border-[#1a1a1a] bg-[#050505] p-4 sm:p-5">
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#1a1a1a] pb-3">
    <h2 className="text-xs font-bold uppercase tracking-widest text-[#00ff9c]">Section</h2>
    <span className="text-[10px] text-zinc-600">STATUS</span>
  </div>
  {/* content */}
</section>
```

Use `gap-2` for controls, `gap-4` for field groups, and `space-y-6` between major sections. Avoid nested rounded cards for every field; grouping should explain structure, not add visual noise.

## Controls and actions

`ToolActionPanel` and `ToolActionButton` are the canonical toolbar controls. Keep them together and let them wrap on small screens. For the subnetting/defanger baseline, pass `className="rounded-none"` to these controls. Do not duplicate a custom button style in each tool.

```tsx
<ToolActionPanel label="ACTIONS" className="rounded-none">
  <ToolActionButton className="rounded-none" tone="neutral">Reset</ToolActionButton>
  <ToolActionButton className="rounded-none" tone="accent">Run</ToolActionButton>
  <ToolActionButton className="rounded-none" tone="danger">Clear</ToolActionButton>
</ToolActionPanel>
```

Action semantics:

- neutral: navigation, copy, import/export, view changes;
- accent: primary local operation or execution;
- danger: destructive reset/delete, always with clear wording;
- disabled: use only when the reason is apparent or explained beside it.

Buttons must have visible text unless an icon-only button has an accessible `aria-label` and a `title`. Toolbars should not force horizontal scrolling.

## Badges and direct access

Badges are compact metadata, not miniature buttons. Use a thin border, short text and a semantic tone:

```tsx
<span className="inline-flex min-h-5 items-center border border-[#795c19] px-1.5 text-[9px] font-bold uppercase tracking-wider text-[#fbbf24]">
  3 issues
</span>
<span className="border border-[#2a2a2a] bg-[#111111] px-1.5 py-0.5 text-[9px] text-zinc-500">
  ⌘ K
</span>
```

Use number badges for notifications, recent items and result counts. Use shortcut badges for keyboard hints. Direct-access rows may combine an icon, label and count badge; the icon must not be the only label. A `Show more` control follows the MITRE Reference pattern: text button, down chevron, thin border or bottom divider, no pill shape.

## Forms

Use the shared controls from `src/components/ui`. Labels are selectable and must have enough separation from their control. Checkboxes are square, matching the tool panels. A field error belongs next to the field; it must not use a browser alert.

```tsx
<div className="space-y-2">
  <Label htmlFor="example-input" className="text-xs font-bold text-zinc-200">
    Input label
  </Label>
  <Input id="example-input" placeholder="example value" />
  <p className="text-[10px] text-zinc-600">Short, actionable helper text.</p>
</div>
```

For multiline content use the shared `Textarea`. For binary options use the shared `Checkbox` with a text label. Preserve a minimum 44px effective click target, including the label.

## Feedback and status

All user feedback is non-blocking. Use `useNotification()` for transient operation results and inline status for persistent validation. Never add `alert()` to a tool. The notification provider supports `info`, `attention` and `error`; keep messages short, actionable and safe to dismiss.

```tsx
const { notify } = useNotification();
notify("Copied to clipboard");
notify("Review the selected value", "attention");
notify("The input is not valid", "error");
```

Notification rules:

- use `info` for successful local operations and neutral status;
- use `attention` when the user should review a value or understand a non-blocking risk;
- use `error` for failed operations or invalid input;
- use a notification for copy/export completion, storage failures, import failures and other transient results;
- keep validation beside the input when the user can correct it immediately;
- do not use notifications for every keystroke or calculation update;
- never put secrets, full tokens or sensitive input into a notification;
- never call `alert()`; the provider contains a compatibility bridge for legacy code, but new code must call `notify()` directly.

Inline status should use a compact border and a semantic colour:

```tsx
<div role="status" className="border border-[#176b52] bg-[#080808] px-3 py-2 text-xs text-[#9fffd1]">
  Ready — processing stays in this browser.
</div>
```

Do not hide important errors in colour, animation or a toast that disappears too quickly. Respect `prefers-reduced-motion` (already handled globally).

## Modals, import/export and dropped files

Modals are reserved for a focused decision, preview or edit flow. They use a dark backdrop, a square bordered panel, a clear title row, an explicit close button and footer actions. They must close with Escape, restore focus to the trigger and keep their own scroll area inside the viewport. Do not use a modal for a transient copy message or a simple validation error.

Import and export are secondary to the main workflow and live in their own bordered group, below or beside the editor. Import areas should support keyboard activation and drag-and-drop:

- dashed border, black surface and a cloud/upload icon;
- clear accepted formats, size limit and local-processing statement;
- visible file name and validation state after selection;
- no automatic network upload and no silent overwrite;
- export buttons use a separate group and describe the output format.

The visual reference includes both the modal and dropzone states. Keep the actual file input visually hidden only when the dropzone remains a labelled keyboard target.

## Sliders and numeric controls

Sliders follow the calculator pattern: a compact uppercase label, a phosphor or amber `accent-*` track, a visible current value, and a numeric input when precision matters. Keep the slider and numeric field synchronized and validate both paths.

```tsx
<div className="flex items-center gap-4">
  <input type="range" min="0" max="32" value={prefix} onChange={onPrefixChange}
    className="tool-range flex-1" />
  <Input className="w-20 rounded-none text-center" value={prefix} onChange={onPrefixInput} />
</div>
```

The canonical `.tool-range` has a thin dark track, a filled selected portion and a square phosphor thumb; use `data-tone="amber"` when the value represents attention or overhead. Use green for the primary value. Do not hide the current value in a tooltip or rely on the thumb colour alone.

## Animation rules

Animation is functional feedback, not decoration. Use 120–180ms transitions for border/colour changes, 180–240ms for panels entering or leaving, and the existing stepped cursor blink for terminal decoration. Loading indicators must be subtle and stop when work finishes. Avoid bouncing cards, perpetual background motion, layout-shifting animations and animation on every keystroke. Every animation must remain usable with `prefers-reduced-motion: reduce`.

## Disclosure, tabs and dense data

Use the same disclosure pattern across tools. Native `details` keeps the interaction accessible and avoids a different arrow/control implementation in every feature:

```tsx
<details className="border-b border-[#1a1a1a] py-3">
  <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-200">
    Advanced options
  </summary>
  <div className="mt-3">Content</div>
</details>
```

Use the shared tabs for mutually exclusive views. For tables, keep the header legible, use `overflow-x-auto` only around the table, and never allow long values to break the surrounding page.

## Canvas and complex tools

Canvas tools may use full width, React Flow or a custom workspace, but the surrounding shell remains the same:

- toolbar controls use the shared action components;
- help/guide content belongs below or beside the workspace, not inside the primary canvas area;
- import/export is a secondary action group, visually separated from creation/editing;
- status and validation are visible inside the workspace or in the notification layer;
- responsive layouts must provide an intentional mobile mode instead of merely shrinking the canvas;
- keep third-party attribution when the library requires it (for example React Flow).

### Diagram visual contract

The current Network Diagram Generator is the reference for diagram-capable tools. The direct-only `/design-system` page renders the same relationships in a smaller example. A diagram workspace has:

- a compact top toolbar for undo/redo, view, fit and canvas settings;
- a left toolbox that can switch between device palette and selected-item inspector;
- a searchable, collapsible palette grouped by Network, Security, Compute, Services, Cloud and Endpoints;
- device cards with an icon, label, hostname/IP, VLAN or other metadata, status and visible-on-hover connection handles;
- square dark cards as the canonical style, with a compact terminal variant and a light export variant available when the user needs a different output;
- dashed group containers for office, DMZ, server zone or other visual boundaries, with editable label and colour;
- cables with source/target direction, optional labels, semantic colour and enough contrast against the canvas;
- a validation/review area, topology analysis, path finder and saved local snapshots outside the primary canvas;
- import/export separated from editing, with PNG dark/light/alpha, SVG, JSON, CSV inventory and Markdown where the tool supports them;
- React Flow attribution retained whenever React Flow is used.

The three box treatments shown in the reference are intentional: the first is the product default, the second is a dense terminal alternative, and the third is for light/print exports. Do not silently change the default canvas to the export variant.

Connection and movement affordances:

- show handles on node hover/focus instead of permanently covering the card;
- use arrow or direction icons for move up/down, ordering and directional cable semantics;
- keep delete-line and destructive actions in the editing toolbox, not mixed into export controls;
- use a non-invasive notification or inline canvas status for invalid connections;
- never allow a decision/connection rule that the domain validator says is impossible, even if the visual editor can be manipulated.

### CLI-oriented tools

Tools that model a shell, command runner or command reference should use the CLI pattern shown in the reference page: a bounded black terminal surface, a visible `>` prompt, command input, explicit Run action, readable output history and safe example commands. The simulator is a UI pattern, not permission to execute arbitrary commands.

Commands should be validated before processing, dangerous commands should use the shared warning/risk flow, and copy feedback should use the notification provider. Never execute on keystroke or hide command errors in a toast only.

## Content-specific patterns

### Code editors

Use a dedicated no-wrap code field for YAML, JSON, JavaScript/TypeScript, Python, Shell/PowerShell, SQL, Terraform and similar formats. It should have a language label, line numbers, horizontal scrolling, copy/download actions and syntax-oriented colours. Keep code separate from prose: runbook descriptions, incident notes and explanations use a wrapping textarea with resize or a bounded scroll area. Never force code to wrap just to avoid horizontal scrolling.

### Timelines

Use the RPO/RTO-style timeline for ordered operational events: timestamp first, severity second, event title third and optional detail below. A thin vertical rule with square markers is easier to scan than a card per event. Use green for normal, amber for attention and red for failure; include a legend or text label so colour is not the only signal.

### Stats and charts

Stats panels follow the PCAP pattern: a compact grid of flat cells, small uppercase label, prominent value, delta/context line and consistent alignment. Charts sit below or beside the stats, use a restrained grid/axis treatment and one primary line colour. Use SVG/canvas only when it adds meaning; include a text summary and empty state. Do not use giant dashboard cards or gradients.

### Tables

Tables use a thin header divider, compact cells, stable column alignment and `overflow-x-auto` at the table boundary on small screens. Keep status text visible, allow row focus/selection, and provide an empty state. Do not let long identifiers expand the page or truncate data without a title/details path.

### Checkbox variants

The shared checkbox is square. Use binary checkboxes for independent choices, indeterminate checkboxes for partial selection, grouped checkboxes for multi-select filters, and a bordered destructive confirmation for irreversible actions. Use radios or tabs for mutually exclusive choices and a switch only for an immediate on/off setting. Labels remain selectable and form the click target.

### Iconography

Use Lucide icons with consistent 1.5–2px stroke and a 14–18px footprint. The reference icon set covers routers/switches, servers/VMs/containers, firewalls/IDS/VPN, databases/NAS/disks, Wi-Fi/cloud/DNS, PCs/endpoints, batteries/UPS, cables/links, upload/download and directional movement. Icons identify context; text still names the action or device. Keep semantic tones aligned with the product palette and give icon-only controls an accessible name.

## Anatomy of a new tool

Start with the composition rendered on `/design-system` and adapt the content, not the visual grammar:

1. `ToolLayout` provides the global header, search, favourites and local-processing disclosure.
2. A square `[IN]` or configuration surface contains the primary inputs and helper text.
3. A clearly labelled primary action performs the local operation.
4. An `[OUT]` surface presents results with copyable values where useful.
5. Empty, loading, validation and failure states remain inside the relevant surface.
6. Export, import, advanced options and documentation come after the main workflow.

Canonical tool panel:

```tsx
<article className="border border-[#1a1a1a] bg-[#050505]">
  <header className="border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
    <span className="text-xs text-[#00ff9c]">[IN]</span>
    <span className="ml-2 text-sm font-semibold uppercase tracking-widest text-[#ffb000]">
      Input Config
    </span>
  </header>
  <div className="p-6">Inputs and one primary action</div>
</article>
```

This makes a calculator, parser, generator or auditor immediately recognisable as part of IT_TOOLS while leaving room for domain-specific logic.

## Accessibility and responsive rules

- Every interactive element is keyboard reachable and has a visible focus ring.
- Icon-only controls have an accessible name.
- Text remains readable at 200% zoom and long content wraps or scrolls inside its intended container.
- Use `min-w-0` in flex/grid children and `overflow-x-auto` at the smallest responsible boundary.
- Do not rely on hover to expose essential actions on touch devices.
- Do not use animation to convey the only meaning of a state.

## Consistency checklist for new or migrated tools

1. Uses `ToolLayout` and local JetBrains Mono.
2. Uses the canonical shell/panel/border tokens.
3. Matches the squared subnetting/defanger baseline; no unnecessary rounded surfaces.
4. Reuses shared action, form, table, tabs, slider and notification components.
5. Has one clear primary action and no toolbar overflow at mobile width.
6. Shows validation inline or through the notification provider, never `alert()`.
7. Handles empty, loading, error and long-content states.
8. Keeps all local data local and documents any intentional external request.
9. Passes typecheck, tests, build and `git diff --check`.

When an existing tool differs, migrate its visual shell first and preserve its working domain logic. The `/design-system` page is a living visual regression reference, not a second product surface.
