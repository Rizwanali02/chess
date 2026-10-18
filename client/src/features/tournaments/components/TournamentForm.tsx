import { useForm, useWatch } from 'react-hook-form'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import {
  createTournamentSchema,
  updateTournamentSchema,
  type CreateTournamentFormInput,
  type CreateTournamentFormValues,
  type UpdateTournamentFormInput,
  type UpdateTournamentFormValues,
} from '@/features/tournaments/schemas/tournament-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TournamentStatus } from '@/types/api'

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toIsoString(value: string): string {
  return new Date(value).toISOString()
}

type CreateModeProps = {
  mode: 'create'
  defaultValues?: Partial<CreateTournamentFormValues>
  onSubmit: (values: CreateTournamentFormValues) => void
  submitting?: boolean
  submitLabel?: string
}

type EditModeProps = {
  mode: 'edit'
  defaultValues?: Partial<UpdateTournamentFormValues>
  onSubmit: (values: UpdateTournamentFormValues) => void
  submitting?: boolean
  submitLabel?: string
}

type TournamentFormProps = CreateModeProps | EditModeProps

export function TournamentForm(props: TournamentFormProps) {
  const {
    mode,
    defaultValues,
    onSubmit,
    submitting = false,
    submitLabel,
  } = props

  if (mode === 'edit') {
    return (
      <EditTournamentForm
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        submitting={submitting}
        submitLabel={submitLabel}
      />
    )
  }

  return (
    <CreateTournamentForm
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      submitting={submitting}
      submitLabel={submitLabel}
    />
  )
}

function CreateTournamentForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = 'Create tournament',
}: {
  defaultValues?: Partial<CreateTournamentFormValues>
  onSubmit: (values: CreateTournamentFormValues) => void
  submitting: boolean
  submitLabel?: string
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTournamentFormInput, undefined, CreateTournamentFormValues>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: '',
      initialSeconds: 600,
      incrementSeconds: 0,
      startsAt: '',
      ...defaultValues,
    },
  })

  const busy = submitting || isSubmitting

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          startsAt: toIsoString(values.startsAt),
        }),
      )}
    >
      <TournamentFields
        register={{
          name: register('name'),
          initialSeconds: register('initialSeconds'),
          incrementSeconds: register('incrementSeconds'),
          startsAt: register('startsAt'),
        }}
        errors={{
          name: errors.name?.message,
          initialSeconds: errors.initialSeconds?.message,
          incrementSeconds: errors.incrementSeconds?.message,
          startsAt: errors.startsAt?.message,
        }}
        disabled={busy}
      />
      <Button type="submit" disabled={busy}>
        {busy ? (
          <>
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
            Saving…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}

function EditTournamentForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = 'Save changes',
}: {
  defaultValues?: Partial<UpdateTournamentFormValues>
  onSubmit: (values: UpdateTournamentFormValues) => void
  submitting: boolean
  submitLabel?: string
}) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTournamentFormInput, undefined, UpdateTournamentFormValues>({
    resolver: zodResolver(updateTournamentSchema),
    defaultValues: {
      name: '',
      initialSeconds: 600,
      incrementSeconds: 0,
      status: 'DRAFT',
      ...defaultValues,
      startsAt: defaultValues?.startsAt
        ? toDatetimeLocalValue(defaultValues.startsAt)
        : '',
    },
  })

  const status = useWatch({ control, name: 'status' })
  const busy = submitting || isSubmitting

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          startsAt: toIsoString(values.startsAt),
        }),
      )}
    >
      <TournamentFields
        register={{
          name: register('name'),
          initialSeconds: register('initialSeconds'),
          incrementSeconds: register('incrementSeconds'),
          startsAt: register('startsAt'),
        }}
        errors={{
          name: errors.name?.message,
          initialSeconds: errors.initialSeconds?.message,
          incrementSeconds: errors.incrementSeconds?.message,
          startsAt: errors.startsAt?.message,
        }}
        disabled={busy}
      />
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={status}
          onValueChange={(value) => {
            if (value == null) return
            setValue('status', value as TournamentStatus, {
              shouldValidate: true,
            })
          }}
          disabled={busy}
        >
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="ONGOING">Ongoing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        {errors.status ? (
          <p className="text-xs text-destructive">{errors.status.message}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? (
          <>
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
            Saving…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}

type TournamentFieldName = 'name' | 'initialSeconds' | 'incrementSeconds' | 'startsAt'

function TournamentFields({
  register,
  errors,
  disabled,
}: {
  register: Record<TournamentFieldName, UseFormRegisterReturn>
  errors: Partial<Record<TournamentFieldName, string>>
  disabled: boolean
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          disabled={disabled}
          aria-invalid={Boolean(errors.name)}
          {...register.name}
        />
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="initialSeconds">Initial seconds</Label>
          <Input
            id="initialSeconds"
            type="number"
            min={60}
            max={7200}
            disabled={disabled}
            aria-invalid={Boolean(errors.initialSeconds)}
            {...register.initialSeconds}
          />
          {errors.initialSeconds ? (
            <p className="text-xs text-destructive">
              {errors.initialSeconds}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="incrementSeconds">Increment seconds</Label>
          <Input
            id="incrementSeconds"
            type="number"
            min={0}
            max={60}
            disabled={disabled}
            aria-invalid={Boolean(errors.incrementSeconds)}
            {...register.incrementSeconds}
          />
          {errors.incrementSeconds ? (
            <p className="text-xs text-destructive">
              {errors.incrementSeconds}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startsAt">Starts at</Label>
        <Input
          id="startsAt"
          type="datetime-local"
          disabled={disabled}
          aria-invalid={Boolean(errors.startsAt)}
          {...register.startsAt}
        />
        {errors.startsAt ? (
          <p className="text-xs text-destructive">{errors.startsAt}</p>
        ) : null}
      </div>
    </>
  )
}
