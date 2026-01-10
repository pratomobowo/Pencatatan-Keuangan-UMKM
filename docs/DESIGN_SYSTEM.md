# Admin Dashboard Design System

> **Purpose:** Strict guidelines for consistent, clean, and aesthetic UI across all Admin Dashboard components.

---

## 1. Typography

| Element | Class | Notes |
|---------|-------|-------|
| **Page Title** | `text-2xl font-semibold text-slate-800` | Main header of the page |
| **Section Title** | `text-lg font-semibold text-slate-700` | Card headers, sub-sections |
| **Body Text** | `text-sm text-slate-600` | Default paragraph text |
| **Small/Meta Text** | `text-xs text-slate-400` | Timestamps, hints |
| **Labels** | `text-sm text-slate-700 font-medium` | Form labels, table headers |
| **Numbers (Stats)** | `text-2xl sm:text-3xl font-semibold` | Summary card values |

> [!IMPORTANT]
> **Never use `font-bold`**. Use `font-semibold` for emphasis and `font-medium` for subtle highlights.

---

## 2. Colors

### Primary Palette (Actions & Accents)
| Name | Class | Usage |
|------|-------|-------|
| Primary | `bg-blue-600`, `text-blue-600` | Primary buttons, links |
| Primary Hover | `hover:bg-blue-700` | Button hover state |

### Semantic Colors
| Name | Background | Text | Usage |
|------|------------|------|-------|
| Success | `bg-emerald-500` | `text-emerald-600` | Success states, positive actions |
| Warning | `bg-orange-500` | `text-orange-600` | Pending, warnings |
| Danger | `bg-rose-500` | `text-rose-600` | Errors, destructive actions |
| Info | `bg-indigo-500` | `text-indigo-600` | Informational states |

### Neutral Colors (Backgrounds & Borders)
| Name | Class | Usage |
|------|-------|-------|
| Page BG | `bg-slate-50` | Main page background |
| Card BG | `bg-white` | Card, modal backgrounds |
| Table Header BG | `bg-slate-50` | Table thead row |
| Border Light | `border-slate-200` | Default borders |
| Border Subtle | `border-slate-100` | Internal dividers |

> [!TIP]
> Avoid gradients. Use **solid colors** only for a clean, flat design.

---

## 3. Spacing

| Element | Padding/Gap | Class |
|---------|-------------|-------|
| Card (outer) | 24px (6) | `p-6` |
| Card (compact) | 16px (4) | `p-4` |
| Section Gap | 24px (6) | `space-y-6` or `gap-6` |
| Form Elements Gap | 16px (4) | `space-y-4` or `gap-4` |
| Table Cell Padding | 12-16px | `px-4 py-3` |
| Button Padding | 8-12px x 16-24px | `px-4 py-2` or `px-6 py-2.5` |

---

## 4. Components

### 4.1 Buttons

| Type | Classes |
|------|---------|
| **Primary** | `px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm` |
| **Secondary** | `px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm` |
| **Danger** | `px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium text-sm` |
| **Icon Button** | `p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors` |

> [!CAUTION]
> Always use `transition-colors` for smooth hover effects. Button text should be `font-medium`, not bold.

---

### 4.2 Cards

```jsx
<Card className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
  {/* Content */}
</Card>
```

| Prop | Value |
|------|-------|
| Padding | `p-6` (standard), `p-4` (compact) |
| Border Radius | `rounded-xl` |
| Border | `border border-slate-200` |
| Shadow | `shadow-sm` |

**Summary Cards (Stats):**
```jsx
<Card className="p-0 overflow-hidden border-none shadow-sm">
  <div className="bg-indigo-600 p-4 sm:p-5 text-white">
    {/* Use solid bg-[color]-500/600 */}
  </div>
</Card>
```

---

### 4.3 Tables

```jsx
<table className="w-full">
  <thead className="bg-slate-50">
    <tr className="border-b border-slate-200">
      <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Header</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3 text-slate-900">Data</td>
    </tr>
  </tbody>
</table>
```

| Element | Classes |
|---------|---------|
| Header Row | `bg-slate-50 border-b border-slate-200` |
| Header Cell | `text-left px-4 py-3 text-sm font-semibold text-slate-700` |
| Body Row | `border-b border-slate-100 hover:bg-slate-50/50 transition-colors` |
| Body Cell | `px-4 py-3 text-slate-900` (primary), `text-slate-600` (secondary) |

---

### 4.4 Inputs & Selects

```jsx
<input className="w-full p-2.5 bg-white border border-slate-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
```

| Element | Classes |
|---------|---------|
| Input/Textarea | `w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm` |
| Select | Same as Input |
| Label | `block text-sm text-slate-700 font-medium mb-1` |

---

### 4.5 Badges

```jsx
<span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
  Active
</span>
```

| Status | Background | Text |
|--------|------------|------|
| Success/Active | `bg-emerald-100` | `text-emerald-800` |
| Warning/Pending | `bg-yellow-100` | `text-yellow-800` |
| Danger/Cancelled | `bg-rose-100` | `text-rose-800` |
| Info/Default | `bg-blue-100` | `text-blue-800` |
| Neutral | `bg-slate-100` | `text-slate-800` |

---

### 4.6 Tabs

**Container:**
```jsx
<div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
  {/* Tab buttons */}
</div>
```

**Tab Button (Active):**
```jsx
<button className="px-4 py-2 text-sm font-medium rounded-md bg-white text-slate-900 shadow-sm transition-all">
  Active Tab
</button>
```

**Tab Button (Inactive):**
```jsx
<button className="px-4 py-2 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 hover:bg-white/50 transition-all">
  Inactive Tab
</button>
```

| Element | Classes |
|---------|---------|
| Container | `flex gap-1 p-1 bg-slate-100 rounded-lg` |
| Active Tab | `px-4 py-2 text-sm font-medium rounded-md bg-white text-slate-900 shadow-sm` |
| Inactive Tab | `px-4 py-2 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 hover:bg-white/50` |

**Alternative (Underline Style):**
```jsx
<div className="flex border-b border-slate-200">
  <button className="px-4 py-2.5 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Active</button>
  <button className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700">Inactive</button>
</div>
```

---

### 4.7 Modals

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
  <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
    <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white">
      <h2 className="text-lg font-semibold text-slate-800">Title</h2>
      {/* Close Button */}
    </div>
    <div className="p-6">
      {/* Content */}
    </div>
  </div>
</div>
```

---

## 5. Icons

- **Library:** Lucide React
- **Size:** `size={16}` (inline), `size={20}` (buttons), `size={24}` (cards)
- **Color:** Inherit from parent text color (`className="text-slate-400"`)

---

## 6. States

| State | Style |
|-------|-------|
| Hover (buttons) | `hover:bg-[color]-700` or `hover:bg-slate-50` |
| Hover (rows) | `hover:bg-slate-50/50` |
| Focus (inputs) | `focus:ring-2 focus:ring-blue-500 focus:border-transparent` |
| Disabled | `opacity-50 cursor-not-allowed` |
| Loading | `animate-spin` on loader icon |

---

## 7. Admin Dashboard Layout

> **CRITICAL RULE**: Every admin page MUST wrap ALL content (after stat cards) inside a `Card` component. No content should float outside of a Card.

### 7.1 Page Wrapper (Root Container)

```jsx
<div className="space-y-6">
  {/* All page content goes here */}
</div>
```

- **Gap**: Always use `space-y-6` between major sections.
- **No outer padding** (handled by parent layout).

---

### 7.2 Standard Page Template

> ⚠️ **MANDATORY**: After the `space-y-6` wrapper, ALL content MUST be inside `<Card>` components.

```jsx
<div className="space-y-6">
  {/* 1. Summary Cards (Optional - each is already a Card) */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Stat cards */}
  </div>

  {/* 2. Main/Parent Card - REQUIRED */}
  <Card>
    {/* 2a. Action Bar (Title + Subtitle + Buttons) - ONLY in Parent Card */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800">Page Title</h3>
        <p className="text-xs text-slate-500 mt-0.5">Page subtitle/description</p>
      </div>
      <div className="flex gap-2">
        {/* Action Buttons */}
      </div>
    </div>

    {/* Rest of content... */}
  </Card>
</div>
```

> 💡 **Parent vs Child Cards**:
> - **Parent Card**: Has Title + Subtitle in Action Bar
> - **Child/Nested Cards** (e.g., Tab content): Only Title, NO subtitle (context already provided by parent)

```jsx
{/* ✅ Child Card - Title only, no subtitle */}
<Card>
  <h3 className="text-lg font-semibold text-slate-800 mb-6">Section Title</h3>
  {/* Content... */}
</Card>
```

---

### 7.2.1 Filter/Search Bar (if needed)

    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search + Filters */}
    </div>

    {/* 2c. Info Text (if needed) */}
    <div className="text-xs text-slate-500 mb-4">
      Menampilkan X dari Y items
    </div>

    {/* 2d. Main Content (Table, Grid, Form, Tabs) */}
    <div className="overflow-x-auto">
      <table className="w-full">...</table>
    </div>

    {/* 2e. Pagination (if needed) */}
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
      {/* Pagination controls */}
    </div>
  </Card>
</div>
```

---

### 7.3 ❌ NEVER DO THIS

```jsx
// ❌ WRONG - Content floating outside Card
<div className="space-y-6">
  <div className="flex justify-between items-center">
    <h2>Page Title</h2>
    <button>Add New</button>
  </div>
  <div className="flex gap-2">
    <input placeholder="Search..." />
  </div>
  <table>...</table>  // ❌ Table not in Card!
</div>
```

```jsx
// ✅ CORRECT - All content inside Card
<div className="space-y-6">
  <Card>
    <div className="flex justify-between items-center mb-6">
      <h2>Page Title</h2>
      <button>Add New</button>
    </div>
    <div className="flex gap-2 mb-4">
      <input placeholder="Search..." />
    </div>
    <table>...</table>  // ✅ Inside Card
  </Card>
</div>
```

---

### 7.4 Layout Patterns

| Pattern | Structure |
|---------|-----------| 
| **Single Card (Default)** | `space-y-6` → (Stat Cards) → Main Card (with Action Bar inside) |
| **Multi-Section** | `space-y-6` → Card 1 → Card 2 → Card 3 (each section in own Card) |
| **Two Column** | `space-y-6` → `grid lg:grid-cols-12 gap-6` → Card (lg:col-span-4) + Card (lg:col-span-8) |
| **Tabbed Content** | `space-y-6` → Card (with Action Bar + Tabs inside) → Tab content Cards |

---

### 7.5 Content Section Order (Inside Card)

Every content card should follow this order:

1. **Action Bar** — Title + Subtitle + Buttons (flex justify-between, mb-6)
2. **Tabs** — If tabbed interface, tabs go here (as pill-style buttons)
3. **Filter/Search** — Search input + dropdowns (flex gap-3, mb-4)
4. **Info Text** — "Menampilkan X dari Y" (text-xs text-slate-500 mb-4)
5. **Main Content** — Table, Grid, Form, or Tab Content
6. **Pagination** — (if applicable, mt-4 pt-4 border-t)

---

### 7.6 Grid Classes Reference

| Context | Classes |
|---------|---------|
| Page Container | `space-y-6` |
| Stat Cards Grid | `grid grid-cols-2 lg:grid-cols-4 gap-4` |
| Content Grid (2 cols) | `grid grid-cols-1 md:grid-cols-2 gap-6` |
| Content Grid (3 cols) | `grid grid-cols-1 md:grid-cols-3 gap-6` |
| Form Grid (2 cols) | `grid grid-cols-1 md:grid-cols-2 gap-4` |
| Two Column Layout | `grid grid-cols-1 lg:grid-cols-12 gap-6` |

---


## 8. Page Structure & Content Patterns

### 8.1 Content Header (Inside Card)

```jsx
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
  <div>
    <h3 className="text-lg font-semibold text-slate-800">Section Title</h3>
    <p className="text-sm text-slate-500 mt-0.5">Optional description</p>
  </div>
  <button className="...">Action Button</button>
</div>
```

| Element | Classes |
|---------|---------|
| Container | `flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6` |
| Title | `text-lg font-semibold text-slate-800` |
| Subtitle | `text-sm text-slate-500 mt-0.5` |

---

### 8.2 Subheading (Within Sections)

```jsx
<h4 className="text-sm font-semibold text-slate-700 mb-3">Subheading</h4>
```

| Variant | Classes |
|---------|---------|
| Standard | `text-sm font-semibold text-slate-700 mb-3` |
| With divider | `text-sm font-semibold text-slate-700 pb-2 border-b border-slate-100 mb-4` |

---

### 8.3 Filter & Search Bar

```jsx
<div className="flex flex-col sm:flex-row gap-3 mb-6">
  {/* Search */}
  <div className="relative flex-1 max-w-md">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
    <input
      type="text"
      placeholder="Cari..."
      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
    />
  </div>
  {/* Filter Dropdown */}
  <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
    <option>Semua Status</option>
  </select>
</div>
```

| Element | Classes |
|---------|---------|
| Container | `flex flex-col sm:flex-row gap-3 mb-6` |
| Search Wrapper | `relative flex-1 max-w-md` |
| Search Icon | `absolute left-3 top-1/2 -translate-y-1/2 text-slate-400` (size 18) |
| Search Input | `w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm` |
| Filter Select | `px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white` |

---

### 8.4 Action Bar (Top of Card)

```jsx
<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
  <h3 className="text-lg font-semibold text-slate-800">Title</h3>
  <div className="flex gap-2">
    <button className="px-4 py-2 border border-slate-300 ...">Secondary</button>
    <button className="px-4 py-2 bg-blue-600 ...">Primary</button>
  </div>
</div>
```

---

### 8.5 Empty State

```jsx
<div className="py-16 text-center">
  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
    <Package className="text-slate-400" size={24} />
  </div>
  <p className="text-slate-500 text-sm">Tidak ada data ditemukan.</p>
  <button className="mt-4 text-sm text-blue-600 hover:underline">Tambah Baru</button>
</div>
```

| Element | Classes |
|---------|---------|
| Container | `py-16 text-center` |
| Icon Wrapper | `mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4` |
| Icon | `text-slate-400` (size 24) |
| Message | `text-slate-500 text-sm` |
| Action Link | `mt-4 text-sm text-blue-600 hover:underline` |

---

### 8.6 Info/Hint Box

```jsx
<div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
  <Info className="text-blue-500 shrink-0" size={20} />
  <p className="text-sm text-blue-800">Informasi penting atau tips untuk user.</p>
</div>
```

| Variant | BG | Border | Icon | Text |
|---------|----|----|---|---|
| Info | `bg-blue-50` | `border-blue-100` | `text-blue-500` | `text-blue-800` |
| Warning | `bg-amber-50` | `border-amber-100` | `text-amber-500` | `text-amber-800` |
| Success | `bg-emerald-50` | `border-emerald-100` | `text-emerald-500` | `text-emerald-800` |

---

## 9. Don'ts ❌

- ❌ **No `font-bold`** – Use `font-semibold` max.
- ❌ **No gradients** – Solid colors only.
- ❌ **No excessive shadows** – `shadow-sm` is enough.
- ❌ **No inline styles** – Use Tailwind classes.
- ❌ **No inconsistent border radii** – Stick to `rounded-lg` or `rounded-xl`.
- ❌ **No primary colors for text** – Only for buttons/links.

---

## Quick Reference Cheatsheet

```
Page Title:       text-2xl font-semibold text-slate-800
Section Title:    text-lg font-semibold text-slate-700
Body Text:        text-sm text-slate-600
Label:            text-sm text-slate-700 font-medium
Primary Button:   px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
Secondary Button: px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50
Card:             p-6 bg-white rounded-xl border border-slate-200 shadow-sm
Input:            p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500
Badge:            px-2 py-1 rounded-full text-xs font-medium bg-[color]-100 text-[color]-800
```
