import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../format'

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — Homeo` : 'Homeo — Patient records'
  }, [title])
}

export function Back({ to, children }) {
  return (
    <Link className="back" to={to}>
      {children}
    </Link>
  )
}

export function PageHeader({ eyebrow, title, lede, actions, documentTitle }) {
  useTitle(documentTitle || title)
  return (
    <header className="page-head">
      <div className="titles">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
      </div>
      {actions ? <div className="page-actions no-print">{actions}</div> : null}
    </header>
  )
}

export function Notice({ children }) {
  if (!children) return null
  return (
    <p className="notice" role="status">
      {children}
    </p>
  )
}

export function Missing({ title = 'Record not found', copy = 'It may have been deleted.', to = '/patients', action = 'Back to patients' }) {
  useTitle(title)
  return (
    <div className="hero-empty">
      <h1>{title}</h1>
      <p>{copy}</p>
      {to ? (
        <Link className="btn primary" to={to}>
          {action}
        </Link>
      ) : null}
    </div>
  )
}

export function Busy({ title = 'Opening the case book', copy = 'Loading records from Neon.' }) {
  useTitle(title)
  return (
    <div className="hero-empty">
      <h1>{title}</h1>
      <p>{copy}</p>
    </div>
  )
}

export function Field({ label, required, hint, className = '', as = 'label', children }) {
  const Tag = as
  return (
    <Tag className={`field ${className}`.trim()}>
      <span className="field-label">
        {label}
        {required ? <abbr title="Required"> *</abbr> : null}
      </span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </Tag>
  )
}

export function Segmented({ id, name, label, value, options, onChange }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label || name}>
      {options.map((option, index) => (
        <label
          key={option}
          className={value === option ? 'on' : ''}
          onClick={(event) => {
            if (value === option) {
              event.preventDefault()
              onChange('')
            }
          }}
        >
          <input
            id={index === 0 ? id : undefined}
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          {option}
        </label>
      ))}
    </div>
  )
}

export function Fields({ sections, form, onChange }) {
  return sections.map((section) => (
    <section key={section.title} className="section">
      <h2>{section.title}</h2>
      <div className="grid-2">
        {section.fields.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            required={field.required}
            hint={field.hint}
            className={field.span === 2 ? 'span-2' : ''}
            as={field.type === 'segmented' ? 'div' : 'label'}
          >
            <Control field={field} value={form[field.key] ?? ''} onChange={onChange} />
          </Field>
        ))}
      </div>
    </section>
  ))
}

function Control({ field, value, onChange }) {
  const common = {
    id: field.key,
    name: field.key,
    value,
    placeholder: field.placeholder,
    maxLength: field.maxLength,
    autoComplete: field.autoComplete || 'off',
    inputMode: field.inputMode,
    'aria-required': field.required || undefined,
    onChange: (event) => onChange(field.key, event.target.value),
  }
  if (field.type === 'textarea') return <textarea {...common} rows={field.rows || 3} />
  if (field.type === 'select') {
    return (
      <select {...common}>
        <option value="">{field.placeholder || 'Select'}</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }
  if (field.type === 'segmented') {
    return (
      <Segmented
        id={field.key}
        name={field.key}
        label={field.label}
        value={value}
        options={field.options}
        onChange={(next) => onChange(field.key, next)}
      />
    )
  }
  if (field.type === 'number') {
    return (
      <input
        {...common}
        type="number"
        min={field.min}
        max={field.max}
        step="1"
        onWheel={(event) => event.currentTarget.blur()}
      />
    )
  }
  return <input {...common} type={field.type || 'text'} />
}

export function Lines({ rows }) {
  const filled = rows.filter(([, value]) => value != null && String(value).trim() !== '')
  if (!filled.length) return null
  return (
    <dl className="lines">
      {filled.map(([label, value]) => (
        <div key={label} className={String(value).length > 90 ? 'span-2' : ''}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function FormError({ error, errorRef }) {
  if (!error) return null
  return (
    <p className="form-error" role="alert" ref={errorRef}>
      {error}
    </p>
  )
}

export function SaveBar({ label, cancelTo, confirm, onAskDelete, onDelete, onKeep, deleteLabel }) {
  return (
    <div className="form-bar no-print">
      <button className="btn primary" type="submit">
        {label}
      </button>
      <Link className="btn secondary" to={cancelTo}>
        Cancel
      </Link>
      {onAskDelete ? <span className="spacer" /> : null}
      {onAskDelete && !confirm ? (
        <button className="btn ghost danger-text" type="button" onClick={onAskDelete}>
          {deleteLabel}
        </button>
      ) : null}
      {confirm ? (
        <span className="confirm-inline">
          <span>Delete this permanently?</span>
          <button className="btn danger" type="button" onClick={onDelete}>
            Delete
          </button>
          <button className="btn secondary" type="button" onClick={onKeep}>
            Keep
          </button>
        </span>
      ) : null}
    </div>
  )
}

export function recordSections(sections, record, skip = []) {
  return sections
    .map((section) => {
      const rows = section.fields
        .filter((field) => !skip.includes(field.key))
        .map((field) => [field.label, field.type === 'date' ? formatDate(record[field.key]) : record[field.key]])
      const filled = rows.filter(([, value]) => value != null && String(value).trim() !== '')
      return { title: section.title, rows: filled }
    })
    .filter((section) => section.rows.length)
}
