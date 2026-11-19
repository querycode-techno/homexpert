"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Search, Pencil, Trash2, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const api = async (url, opts) => {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) throw new Error(json.error || `Request failed (${res.status})`)
  return json
}

const fmt = (v) => (v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v))
const toInput = (f, v) => {
  if (f.type === "json") return v == null ? "" : JSON.stringify(v, null, 2)
  if (f.type === "list") return Array.isArray(v) ? v.join("\n") : ""
  if (f.type === "date") return v ? new Date(v).toISOString().slice(0, 16) : ""
  if (f.type === "switch") return !!v
  return v ?? ""
}
const fromInput = (f, v) => {
  if (f.type === "json") return v.trim() ? JSON.parse(v) : undefined
  if (f.type === "list") return v.split("\n").map((s) => s.trim()).filter(Boolean)
  if (f.type === "number") return v === "" ? undefined : Number(v)
  if (f.type === "date") return v ? new Date(v).toISOString() : null
  return v
}

/**
 * Generic CRUD table + dialog over /api/admin/cms/[resource].
 * fields: [{ name, label, type: text|number|textarea|select|switch|json|list|date|image|ref, options, ref: { resource, label } , hint }]
 */
export function ResourceManager({ resource, title, columns, fields, filters = [], canCreate = true, canDelete = true, canEdit = true, rowActions, emptyText = "Nothing here yet." }) {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 25 })
  const [q, setQ] = useState("")
  const [filterValues, setFilterValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // { id?, values }
  const [saving, setSaving] = useState(false)
  const [refs, setRefs] = useState({})

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const sp = new URLSearchParams({ page: String(page), limit: "25" })
      if (q) sp.set("q", q)
      Object.entries(filterValues).forEach(([k, v]) => v && sp.set(k, v))
      const json = await api(`/api/admin/cms/${resource}?${sp}`)
      setRows(json.data)
      setMeta(json.meta)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [resource, q, filterValues])

  useEffect(() => { load(1) }, [load])

  useEffect(() => {
    fields.filter((f) => f.type === "ref").forEach(async (f) => {
      try {
        const json = await api(`/api/admin/cms/${f.ref.resource}?limit=100`)
        setRefs((r) => ({ ...r, [f.name]: json.data }))
      } catch { /* ignore */ }
    })
  }, [fields])

  const open = (row) => {
    const values = {}
    fields.forEach((f) => { values[f.name] = toInput(f, row ? row[f.name] : f.default) })
    setEditing({ id: row?._id, values })
  }

  const save = async () => {
    setSaving(true)
    try {
      const body = {}
      fields.forEach((f) => { const v = fromInput(f, editing.values[f.name]); if (v !== undefined) body[f.name] = v })
      await api(editing.id ? `/api/admin/cms/${resource}/${editing.id}` : `/api/admin/cms/${resource}`, { method: editing.id ? "PATCH" : "POST", body: JSON.stringify(body) })
      toast.success("Saved")
      setEditing(null)
      load(meta.page)
    } catch (e) {
      toast.error(e instanceof SyntaxError ? "Invalid JSON in one of the fields" : e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row) => {
    if (!window.confirm("Delete this item? This cannot be undone.")) return
    try {
      await api(`/api/admin/cms/${resource}/${row._id}`, { method: "DELETE" })
      toast.success("Deleted")
      load(meta.page)
    } catch (e) {
      toast.error(e.message)
    }
  }

  const upload = async (file, name) => {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("subfolder", "catalog")
    const res = await fetch("/api/auth/upload/image", { method: "POST", body: fd })
    const json = await res.json()
    if (!res.ok) return toast.error(json.error || "Upload failed")
    const url = json.file.publicUrl.startsWith("http") ? json.file.publicUrl : `${window.location.origin}${json.file.publicUrl}`
    setEditing((e) => ({ ...e, values: { ...e.values, [name]: url } }))
  }

  const setVal = (name, v) => setEditing((e) => ({ ...e, values: { ...e.values, [name]: v } }))

  const renderField = (f) => {
    const v = editing.values[f.name]
    if (f.type === "switch") return <Switch checked={!!v} onCheckedChange={(c) => setVal(f.name, c)} />
    if (f.type === "textarea" || f.type === "json" || f.type === "list") return <Textarea rows={f.type === "json" ? 8 : 4} className={f.type === "json" ? "font-mono text-xs" : ""} value={v} onChange={(e) => setVal(f.name, e.target.value)} />
    if (f.type === "select" || f.type === "ref") {
      const options = f.type === "ref" ? (refs[f.name] || []).map((r) => ({ value: r._id, label: r[f.ref.label] })) : f.options
      return (
        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={v ?? ""} onChange={(e) => setVal(f.name, e.target.value)}>
          <option value="">—</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )
    }
    if (f.type === "image") {
      return (
        <div className="space-y-2">
          <Input value={v} placeholder="https://…" onChange={(e) => setVal(f.name, e.target.value)} />
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary"><Upload className="h-4 w-4" /> Upload image<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], f.name)} /></label>
          {v ? <img src={v} alt="" className="h-20 rounded border object-cover" /> : null}
        </div>
      )
    }
    return <Input type={f.type === "number" ? "number" : f.type === "date" ? "datetime-local" : "text"} value={v} onChange={(e) => setVal(f.name, e.target.value)} />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative"><Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" /><Input className="w-56 pl-8" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {filters.map((f) => (
            <select key={f.name} className="h-10 rounded-md border bg-background px-3 text-sm" value={filterValues[f.name] || ""} onChange={(e) => setFilterValues((s) => ({ ...s, [f.name]: e.target.value }))}>
              <option value="">{f.label}: all</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {canCreate ? <Button onClick={() => open(null)}><Plus className="mr-1 h-4 w-4" /> Add</Button> : null}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow>{columns.map((c) => <TableHead key={c.key || c.label}>{c.label}</TableHead>)}<TableHead className="w-40 text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={columns.length + 1}>Loading…</TableCell></TableRow> : rows.length === 0 ? <TableRow><TableCell colSpan={columns.length + 1} className="text-muted-foreground">{emptyText}</TableCell></TableRow> : rows.map((row) => (
              <TableRow key={row._id}>
                {columns.map((c) => (
                  <TableCell key={c.key || c.label}>
                    {c.render ? c.render(row) : c.badge ? <Badge variant="secondary">{fmt(row[c.key])}</Badge> : fmt(c.key.split(".").reduce((a, k) => a?.[k], row))}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {rowActions?.(row, () => load(meta.page))}
                    {canEdit ? <Button variant="ghost" size="icon" onClick={() => open(row)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button> : null}
                    {canDelete ? <Button variant="ghost" size="icon" onClick={() => remove(row)} aria-label="Delete"><Trash2 className="h-4 w-4 text-red-600" /></Button> : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{meta.total} total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={meta.page * meta.limit >= meta.total} onClick={() => load(meta.page + 1)}>Next</Button>
          </div>
        </div>
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Add"} {title}</DialogTitle></DialogHeader>
          {editing ? <div className="space-y-4">{fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label>{f.label}</Label>
              {renderField(f)}
              {f.hint ? <p className="text-xs text-muted-foreground">{f.hint}</p> : null}
            </div>
          ))}</div> : null}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
