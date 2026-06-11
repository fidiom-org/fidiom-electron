import { useModels } from '../model/use-models'
import { ModelCard } from './ModelCard'
import { SettingsSection } from './SettingsSection'

export const ModelSettings = () => {
  const { models, loading, selectingId, progress, error, select } = useModels()

  return (
    <SettingsSection
      title="AI model"
      description="One on-device model powers both the CFO chat and receipt parsing. Switching downloads the model if needed, then runs fully offline."
    >
      {error && <p className="text-sm text-rose-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading models…</p>
      ) : (
        <div className="space-y-3">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              selecting={selectingId === model.id}
              busy={selectingId !== null}
              progress={progress}
              onSelect={() => void select(model.id)}
            />
          ))}
        </div>
      )}
    </SettingsSection>
  )
}
