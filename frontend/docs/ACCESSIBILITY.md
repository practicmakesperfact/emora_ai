# Emora Accessibility Guide

## ARIA Implementation Reference

This document explains all ARIA (Accessible Rich Internet Applications) attributes used in Emora and how to test them.

---

## What is ARIA?

ARIA attributes help screen readers understand web applications. They add semantic meaning to HTML elements that assistive technologies can interpret.

### Key Principles:
1. **Use native HTML first** - `<button>` is better than `<div role="button">`
2. **Don't hide content** - If sighted users see it, blind users should hear it
3. **Test with real screen readers** - Don't assume it works

---

## ARIA Attributes in Emora

### 1. **Labels** (`aria-label`, `aria-labelledby`)

**Purpose:** Provides accessible names for elements without visible text.

**Used in:**
- Icon-only buttons (Send, Settings, New Chat)
- Form inputs
- Navigation landmarks

**Examples:**
```tsx
// Icon button
<button aria-label="Send message">
  <Send className="w-5 h-5" />
</button>

// Form with description
<form aria-labelledby="form-title" aria-describedby="form-desc">
  <h2 id="form-title">Settings</h2>
  <p id="form-desc">Customize your preferences</p>
</form>
```

**Screen reader announces:** "Send message, button" (instead of just "button")

---

### 2. **Live Regions** (`aria-live`)

**Purpose:** Announces dynamic content changes without moving focus.

**Used in:**
- Chat messages (AI responses)
- Success/error notifications
- Loading states

**Values:**
- `polite` - Waits for user to pause before announcing
- `assertive` - Interrupts immediately (used for AI responses)
- `off` - No announcement

**Example:**
```tsx
<div 
  role="log" 
  aria-live="assertive"
  aria-relevant="additions"
>
  {messages.map(msg => <Message key={msg.id} {...msg} />)}
</div>
```

**Screen reader announces:** "AI: Here's your response..." (as soon as it appears)

---

### 3. **Roles** (`role`)

**Purpose:** Defines the type/purpose of an element.

**Used in Emora:**
| Role | Usage | Example |
|------|-------|---------|
| `alert` | Critical notifications | Crisis detected banner |
| `log` | Auto-updating content | Chat message history |
| `menu` | Popup menu | User account menu |
| `menuitem` | Menu option | Profile, Settings, Sign out |
| `navigation` | Nav landmarks | Sidebar, top bar |
| `tooltip` | Hover descriptions | Collapsed sidebar labels |
| `separator` | Visual divider | Menu dividers |

**Example:**
```tsx
<div role="alert" className="crisis-banner">
  🚨 Crisis detected - connecting to counselor
</div>
```

**Screen reader announces:** "Alert: Crisis detected - connecting to counselor"

---

### 4. **States** (`aria-expanded`, `aria-busy`, `aria-disabled`)

**Purpose:** Communicates current state of interactive elements.

**Used in:**
- Collapsible menus (`aria-expanded`)
- Loading buttons (`aria-busy`)
- Disabled controls (`aria-disabled`)

**Example:**
```tsx
<button 
  aria-haspopup="menu"
  aria-expanded={isOpen}
  aria-label="Open user menu"
>
  <User />
</button>
```

**Screen reader announces:** "Open user menu, button, collapsed" (or "expanded")

---

### 5. **Descriptions** (`aria-describedby`)

**Purpose:** Links an element to its description text.

**Used in:**
- Form inputs with help text
- Checkboxes with explanations

**Example:**
```tsx
<input 
  type="checkbox"
  aria-label="Reduce motion"
  aria-describedby="motion-desc"
/>
<p id="motion-desc">
  Minimize screen animations and transitions
</p>
```

**Screen reader announces:** "Reduce motion, checkbox, not checked. Minimize screen animations..."

---

### 6. **Hidden Content** (`aria-hidden`)

**Purpose:** Hides decorative elements from screen readers.

**Used in:**
- Decorative icons (when text label exists)
- Spacer elements
- Visual-only indicators

**Example:**
```tsx
<button aria-label="Delete conversation">
  <Trash className="w-4 h-4" aria-hidden="true" />
  Delete
</button>
```

**Screen reader announces:** "Delete conversation, button" (icon is skipped)

---

### 7. **Current Page** (`aria-current`)

**Purpose:** Indicates the current page in navigation.

**Used in:**
- Active sidebar links
- Breadcrumbs

**Example:**
```tsx
<Link 
  href="/dashboard"
  aria-current={pathname === '/dashboard' ? 'page' : undefined}
>
  Dashboard
</Link>
```

**Screen reader announces:** "Dashboard, current page, link"

---

## Screen Reader Testing Guide

### Windows Narrator (Built-in)
**Start/Stop:** `Windows + Ctrl + Enter`

**Basic commands:**
- `Tab` - Next interactive element
- `Shift + Tab` - Previous interactive element
- `Caps Lock + Down Arrow` - Read current item
- `Caps Lock + Right Arrow` - Next item
- `Caps Lock + M` - Read from cursor

**Limitations:**
- ❌ Doesn't handle dynamic content well
- ❌ Inconsistent with `aria-live` regions
- ✅ Good for basic keyboard navigation testing

---

### NVDA (Recommended - Free)
**Download:** https://www.nvaccess.org/download/

**Start/Stop:** `Ctrl + Alt + N`

**Basic commands:**
- `Tab` - Next interactive element
- `Down Arrow` - Next item (browse mode)
- `Insert + Down Arrow` - Read all
- `Insert + T` - Read title
- `Insert + F7` - List all links
- `Insert + H` - List all headings

**Why better:**
- ✅ Fully supports `aria-live="assertive"`
- ✅ Announces dynamic changes immediately
- ✅ Industry standard for web testing
- ✅ Free and open source

---

### JAWS (Professional - Paid)
**Download:** https://www.freedomscientific.com/products/software/jaws/

**Start/Stop:** `Insert + F4`

**Basic commands:**
- Similar to NVDA
- `Insert + F6` - List headings
- `Insert + F5` - List form fields

**Why use:**
- ✅ Most popular commercial screen reader
- ✅ Excellent ARIA support
- ✅ Best for enterprise testing
- ❌ Expensive ($90/year or $1,295 lifetime)

---

## Testing Checklist

Use this checklist to verify accessibility:

### Keyboard Navigation
- [ ] All interactive elements reachable with `Tab`
- [ ] Focus visible (blue ring around active element)
- [ ] Tab order follows logical reading order
- [ ] `Enter` activates buttons/links
- [ ] `Escape` closes modals/menus
- [ ] Arrow keys navigate within menus

### Screen Reader
- [ ] All buttons have meaningful names
- [ ] Form inputs have labels
- [ ] Error messages are announced
- [ ] Success messages are announced
- [ ] Loading states are announced ("Loading...")
- [ ] AI responses are announced immediately
- [ ] Current page is identified in navigation

### Visual
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators are visible
- [ ] No information conveyed by color alone
- [ ] Text can be resized to 200% without breaking layout

### Content
- [ ] Images have alt text (or `aria-label`)
- [ ] Videos have captions/transcripts
- [ ] Link text is descriptive ("Read more about crisis support" vs "Click here")

---

## Common ARIA Patterns in Emora

### Chat Messages
```tsx
<div 
  role="log" 
  aria-live="assertive"
  aria-relevant="additions"
  aria-label="Chat conversation"
>
  {messages.map(msg => (
    <div key={msg.id}>
      <strong>{msg.sender}:</strong> {msg.content}
    </div>
  ))}
</div>
```

### Crisis Alert
```tsx
<div 
  role="alert"
  className="crisis-banner"
>
  <AlertTriangle aria-hidden="true" />
  Crisis detected - help is being connected
</div>
```

### Settings Form
```tsx
<form 
  aria-label="Application settings"
  aria-describedby="settings-desc"
>
  <p id="settings-desc">Customize your preferences</p>
  
  <label htmlFor="language">Language</label>
  <select 
    id="language"
    aria-label="Select your preferred language"
  >
    <option>English</option>
    <option>Amharic</option>
  </select>
</form>
```

### Loading Button
```tsx
<button 
  disabled={isLoading}
  aria-busy={isLoading}
  aria-label="Send message"
>
  {isLoading ? (
    <>
      <Loader2 aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </>
  ) : (
    <>
      <Send aria-hidden="true" />
      Send
    </>
  )}
</button>
```

---

## Accessibility Score

Run Chrome Lighthouse to check:

1. Open Chrome DevTools (`F12`)
2. Go to **Lighthouse** tab
3. Check **Accessibility**
4. Click **Generate report**

**Target:** 95+ score

**Common issues:**
- Missing `alt` text on images
- Low contrast colors
- Missing form labels
- Poor heading structure (h1 → h3 without h2)

---

## Resources

- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **WebAIM Screen Reader Survey:** https://webaim.org/projects/screenreadersurvey9/
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **NVDA Download:** https://www.nvaccess.org/download/

---

## Quick Reference Card

| Goal | ARIA Attribute | Example |
|------|----------------|---------|
| Label icon button | `aria-label` | `aria-label="Delete"` |
| Announce changes | `aria-live` | `aria-live="assertive"` |
| Critical alert | `role="alert"` | Crisis banner |
| Loading state | `aria-busy` | `aria-busy={true}` |
| Hide decorative | `aria-hidden` | Icon next to text |
| Current page | `aria-current` | `aria-current="page"` |
| Expanded menu | `aria-expanded` | `aria-expanded={open}` |
| Link description | `aria-describedby` | Help text for inputs |

---

## Status ✅

**Current Emora Accessibility:**
- ✅ All icon buttons have `aria-label`
- ✅ Chat messages have `aria-live="assertive"`
- ✅ Crisis alerts use `role="alert"`
- ✅ Navigation has `role="navigation"`
- ✅ User menu has full ARIA menu pattern
- ✅ Sidebar tooltips for collapsed state
- ✅ Form inputs properly labeled
- ✅ Loading buttons have `aria-busy`
- ✅ WCAG AA contrast ratios (4.5:1+)
- ✅ Keyboard navigation fully supported

**Emora is fully accessible for:**
- 🦯 Blind users (screen readers)
- 👓 Low vision (high contrast, zoom support)
- ♿ Motor disabilities (keyboard-only navigation)
- 🧠 Cognitive disabilities (clear labels, simple language)

---

**Last Updated:** November 10, 2026
**Tested With:** Windows Narrator, NVDA 2024.4, Chrome Lighthouse
