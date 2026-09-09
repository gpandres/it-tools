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
| Muted text | `#a1a1aa` | Descriptions, helper text and secondary metadata |
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

## Shared design API

Import reusable tool patterns from the single public entry point:

```tsx
import {
  ToolPanel,
  ToolPanelHeader,
  ToolPanelTitle,
  ToolPanelBody,
  ToolField,
  ToolStatus,
  ToolProgress,
  ToolDialog,
  ToolConfirmDialog,
  ToolFileDropzone,
  ToolCodeField,
  ToolTimeline,
  ToolHorizontalTimeline,
  ToolStatGrid,
  ToolStat,
  ToolBadge,
  ToolDisclosure,
} from "@/components/tool-design";
```

`src/components/tool-design.ts` is the stable import boundary for tool UI. A tool supplies content, domain validation, state and callbacks. Shared components own colours, spacing, responsive overflow, keyboard semantics, focus behavior and common feedback. Do not import a demo from `src/app/design-system/components`; those files only provide generic sample data to the reference page.

| Component | Use | Tool supplies |
| --- | --- | --- |
| `ToolPanel` composition | Input, output, configuration and grouped result surfaces | title, marker, metadata, body and footer |
| `ToolField` | Label/helper/error relationship for any shared form control | `htmlFor`, label, control and validation message |
| `ToolBadge` | Compact count, state or shortcut metadata | tone and short content |
| `ToolStatus` | Persistent info, success, attention or error feedback | tone, optional title and message |
| `ToolProgress` | Determinate local work progress | label, value, maximum and optional value label |
| `ToolDialog` | Any focused info, edit, import, export or choice flow | trigger, title, description, content and action descriptors |
| `ToolConfirmDialog` | Explicit confirmation, especially destructive work | trigger, exact consequence and confirmation callback |
| `ToolFileDropzone` | Keyboard-accessible browse and drag/drop intake | accepted types, size limit and file/rejection callbacks |
| `ToolCodeField` | No-wrap code with lines, copy and local download | language, code, filename and MIME type |
| `ToolTimeline` | Ordered operational events | stable IDs, timestamps, severity, title, detail and tone |
| `ToolHorizontalTimeline` | Proportional milestones and target windows | ticks, 0–100 positions, segments, events and summary |
| `ToolStatGrid` / `ToolStat` | Dense aligned metrics | label, value, context and tone |
| `ToolDisclosure` | Advanced or secondary content | summary, default state and content |

Shared primitives in `src/components/ui` remain the API for buttons, inputs, textareas, checkboxes, selects, switches, tabs and tables. `ToolActionPanel` and `ToolActionButton` remain available through the same `tool-design` entry point.

### Generic panel composition

```tsx
<ToolPanel>
  <ToolPanelHeader>
    <ToolPanelTitle marker="IN">Input</ToolPanelTitle>
    <ToolBadge tone="success">local</ToolBadge>
  </ToolPanelHeader>
  <ToolPanelBody>
    <ToolField htmlFor="source" label="Source" helper="Describe format and limits.">
      <Input id="source" className="rounded-none" />
    </ToolField>
  </ToolPanelBody>
</ToolPanel>
```

### Generic dialog composition

`ToolDialog` uses the shared Base UI dialog primitive. Escape dismissal, focus trapping, focus restoration, backdrop, bounded scrolling, close control and responsive sizing come from the component. Action descriptors close the dialog by default; set `closeOnSelect: false` only for an action that must keep the dialog open, such as an in-place validation attempt.

```tsx
<ToolDialog
  trigger={<ToolActionButton>Open editor</ToolActionButton>}
  title="Edit item"
  description="Explain the scope and effect of this edit."
  actions={[
    { label: "Save", tone: "accent", onSelect: saveItem },
  ]}
>
  {/* Tool-specific form content */}
</ToolDialog>

<ToolConfirmDialog
  trigger={<ToolActionButton tone="danger">Clear</ToolActionButton>}
  title="Clear current results?"
  description="This removes local results. Source input remains unchanged."
  confirmLabel="Clear results"
  onConfirm={clearResults}
/>
```

Do not render a permanent `role="dialog"` inside a normal page section to imitate a modal. That leaves an invisible or empty modal after close and does not implement Escape, focus trapping or restoration. Use `ToolDialog` even on the design reference page.

### Generic file and data displays

```tsx
<ToolFileDropzone
  accept=".json,.csv"
  acceptedFormats="JSON or CSV"
  maxSizeBytes={2 * 1024 * 1024}
  onFiles={validateFiles}
  onReject={showImportError}
/>

<ToolCodeField
  language="JSON"
  code={generatedOutput}
  filename="result.json"
  mimeType="application/json;charset=utf-8"
/>
```

`ToolFileDropzone` handles selection, drag state, visible filename, size validation and local-processing copy. The tool still validates file type and contents before state replacement. `ToolCodeField` handles clipboard and file feedback through the notification provider.

### Generic timeline data

Both timeline components are data-driven. Positions in `ToolHorizontalTimeline` are percentages on one elapsed-time scale and are clamped to 0–100. First and last labels anchor inside the track, so the final milestone is not clipped. Keep stable event IDs and preserve chronological order.

```tsx
<ToolTimeline items={events} />

<ToolHorizontalTimeline
  title="Operation timeline"
  ticks={["T−10m", "T−5m", "T0", "T+5m"]}
  segments={windows}
  events={milestones}
  summary="Explain how to read this scale."
/>
```

### Coverage and deliberate exclusions

The reference now covers loading progress and destructive confirmation in addition to the earlier states. Native/shared controls cover radio-like choices through tabs or selects, binary settings through switches, and independent selection through checkboxes. Pagination, tooltips and skeleton loaders are not canonical abstractions yet: add one to this API only after a real tool needs it and the interaction contract is known. Diagram nodes, domain validators and command risk logic stay domain-specific; only their surrounding UI uses the shared API.

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

`ToolActionPanel` and `ToolActionButton` are the canonical toolbar controls. They are square by default. Keep them together and let them wrap on small screens. Do not duplicate a custom button style in each tool.

```tsx
<ToolActionPanel label="ACTIONS">
  <ToolActionButton tone="neutral">Reset</ToolActionButton>
  <ToolActionButton tone="accent">Run</ToolActionButton>
  <ToolActionButton tone="danger">Clear</ToolActionButton>
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

For recovery planning, use the `Horizontal timeline` variant shown on `/design-system`: one continuous thin line, square milestone markers, compact event cards and labelled RPO/RTO windows below the sequence. The line should communicate order and target windows; the cards should contain the event detail. Keep it horizontally scrollable or stack the milestones intentionally on small screens rather than shrinking labels until they overlap. Do not copy circular dashboard widgets into the terminal UI.

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
<ToolPanel>
  <ToolPanelHeader>
    <ToolPanelTitle marker="IN">Input config</ToolPanelTitle>
  </ToolPanelHeader>
  <ToolPanelBody>Inputs and one primary action</ToolPanelBody>
</ToolPanel>
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

## Verification for shared UI changes

Run the repository gates after changing the public design API:

```bash
npm run typecheck
npm test
npm run lint:ratchet
npm run build
git diff --check
```

Then exercise `/design-system` at desktop and 390px mobile widths. The minimum browser checks are:

1. No page-level horizontal overflow.
2. `ToolDialog` opens from its trigger, closes with Escape and restores trigger focus after its exit transition.
3. `ToolFileDropzone` exposes a labelled file input and keeps errors inside the flow.
4. `ToolCodeField` copy produces notification feedback and its scroll region is keyboard focusable.
5. `ToolHorizontalTimeline` fits at desktop width and owns horizontal overflow on mobile; the final 100% milestone remains inside the track.
6. The main reference content has no automated WCAG A/AA violations. Manually review contrast where SVG text or layered demo backgrounds prevent an automated decision.
