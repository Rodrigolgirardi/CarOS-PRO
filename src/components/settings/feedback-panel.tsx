import { MessageSquareHeart, Trash2 } from "lucide-react";
import { deleteFeedback } from "@/lib/actions/custom-types";
import { listFeedback } from "@/lib/queries/custom-types";
import { ConfirmButton } from "@/components/ui/confirm";
import { FeedbackForm } from "./feedback-form";

const fmtWhen = (createdAt: string) => {
  const [d, t] = createdAt.split(" ");
  return `${d!.slice(8, 10)}/${d!.slice(5, 7)}/${d!.slice(0, 4)}${t ? `, ${t.slice(0, 5)}` : ""}`;
};

/** Configurações → Feedback: escrever sugestões e ver as já enviadas, em cards. */
export async function FeedbackPanel() {
  const items = await listFeedback();
  return (
    <div className="max-w-3xl space-y-4">
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50/60 px-4 py-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-violet-50 text-violet-600">
            <MessageSquareHeart size={14} />
          </span>
          <h2 className="text-[13px] font-semibold text-zinc-900">Feedback e sugestões</h2>
        </div>
        <div className="px-4 py-4">
          <p className="mb-3 text-xs text-zinc-500">
            Algo que poderia ser melhor, uma ideia nova, um erro que apareceu? Escreva aqui — fica guardado como um card.
          </p>
          <FeedbackForm />
        </div>
      </section>

      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((f) => (
            <article key={f.id} className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="flex-1 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-800">{f.message}</p>
              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2">
                <span className="text-[11px] tabular-nums text-zinc-500">{fmtWhen(f.created_at)}</span>
                <ConfirmButton
                  action={deleteFeedback.bind(null, f.id)}
                  title="Excluir este feedback?"
                  confirmLabel="Excluir"
                  variant="danger-ghost"
                  className="size-7 p-0"
                >
                  <Trash2 size={14} />
                </ConfirmButton>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
