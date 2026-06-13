import { useState, type FormEvent } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  Table,
  type Column,
} from '@/components/common'
import { EditIcon, PlusIcon, TrashIcon } from '@/components/icons'
import { useApi } from '@/hooks/useApi'
import { getErrorMessage } from '@/api/client'
import { usersApi, type CreateUserPayload } from '@/api/resources'
import { formatDateTime } from '@/lib/utils'
import type { User } from '@/types'

interface FormState {
  username: string
  email: string
  password: string
  is_staff: boolean
}

const emptyForm: FormState = { username: '', email: '', password: '', is_staff: false }

export function UserManagementPage() {
  const { data, loading, error, refetch } = useApi(() => usersApi.list(), [])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(user: User) {
    setEditing(user)
    setForm({
      username: user.username,
      email: user.email,
      password: '',
      is_staff: user.is_staff || user.is_superuser,
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      if (editing) {
        const payload: Partial<CreateUserPayload> = {
          username: form.username.trim(),
          email: form.email.trim(),
          is_staff: form.is_staff,
        }
        if (form.password) payload.password = form.password
        await usersApi.update(editing.id, payload)
        setNotice(`User "${form.username}" updated.`)
      } else {
        const payload: CreateUserPayload = {
          username: form.username.trim(),
          email: form.email.trim(),
          is_staff: form.is_staff,
        }
        if (form.password) payload.password = form.password
        await usersApi.create(payload)
        setNotice(
          `User "${form.username}" created. Credentials have been emailed to ${form.email}.`,
        )
      }
      setModalOpen(false)
      refetch()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await usersApi.remove(deleteTarget.id)
      setNotice(`User "${deleteTarget.username}" deleted.`)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setNotice(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'username',
      header: 'Username',
      render: (u) => <span className="font-medium text-slate-900">{u.username}</span>,
    },
    { key: 'email', header: 'Email', render: (u) => u.email },
    {
      key: 'role',
      header: 'Role',
      render: (u) =>
        u.is_superuser ? (
          <Badge color="purple">Superuser</Badge>
        ) : u.is_staff ? (
          <Badge color="blue">Admin</Badge>
        ) : (
          <Badge color="gray">Viewer</Badge>
        ),
    },
    { key: 'created_at', header: 'Created', render: (u) => formatDateTime(u.created_at) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(u)} aria-label="Edit user">
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(u)}
            aria-label="Delete user"
            className="text-bear hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create, update, and remove users (admin only)"
        action={
          <Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={openCreate}>
            New user
          </Button>
        }
      />

      {notice && (
        <Alert variant="success" className="mb-4" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Card>
        <Table
          columns={columns}
          data={data ?? []}
          rowKey={(u) => u.id}
          loading={loading}
          emptyMessage="No users found."
        />
      </Card>

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.username}` : 'Create user'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" loading={submitting}>
              {editing ? 'Save changes' : 'Create user'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            hint={
              editing
                ? 'Leave blank to keep the current password.'
                : 'Leave blank to auto-generate and email the password.'
            }
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_staff}
              onChange={(e) => setForm({ ...form, is_staff: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Grant admin access
          </label>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete user"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{' '}
          <span className="font-medium text-slate-900">{deleteTarget?.username}</span>? This action
          cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
