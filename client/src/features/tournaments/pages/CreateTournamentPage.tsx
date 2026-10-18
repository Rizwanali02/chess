import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TournamentForm } from '@/features/tournaments/components/TournamentForm'
import { useCreateTournament } from '@/features/tournaments/hooks/use-create-tournament'

export function CreateTournamentPage() {
  const navigate = useNavigate()
  const createTournament = useCreateTournament()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Create a tournament"
        description="Set the schedule and time control. New tournaments start as drafts."
      />
      <Card>
        <CardHeader>
          <CardTitle>Tournament details</CardTitle>
        </CardHeader>
        <CardContent>
          <TournamentForm
            mode="create"
            submitting={createTournament.isPending}
            onSubmit={(values) => createTournament.mutate(values)}
          />
          <Button className="mt-4" variant="ghost" onClick={() => navigate('/tournaments')}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
