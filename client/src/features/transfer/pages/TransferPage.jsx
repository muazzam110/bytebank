import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useTransferMutation } from "@/api/transferApi";
import { useReducedEffects } from "@/hooks/useReducedEffects";
import { Card, CardContent } from "@/components/ui/card";
import { goToStep, resetDraft } from "../transferDraftSlice";
import TransferStepper from "../components/TransferStepper";
import RecipientStep from "../components/RecipientStep";
import AmountStep from "../components/AmountStep";
import ReviewStep from "../components/ReviewStep";
import ProcessingOverlay from "../components/ProcessingOverlay";
import ResultCard from "../components/ResultCard";

const TEN_MINUTES = 10 * 60 * 1000;

export default function TransferPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reduced = useReducedEffects();
  const draft = useSelector((s) => s.transferDraft);
  const [transfer, { data, error, isSuccess, isError, reset }] = useTransferMutation();
  const [overlay, setOverlay] = useState(false); // is the loader on screen?
  const [settled, setSettled] = useState(false); // has the server answered (success OR failure)?

  // A draft older than 10 minutes is dropped when you come back
  useEffect(() => {
    if (draft.startedAt && Date.now() - draft.startedAt > TEN_MINUTES) dispatch(resetDraft());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setSettled(false);
    setOverlay(true);
    try {
      await transfer({
        idempotencyKey: draft.idempotencyKey, // SAME key on a retry of this attempt
        recipientAccountId: draft.recipient.accountId,
        amount: draft.amountInput.trim().replace(/\.$/, ""), // the typed STRING, not a number
        description: draft.description.trim(),
      }).unwrap();
      dispatch(resetDraft()); // success → clear the draft (and the key)
    } catch {
      /* ResultCard reads the error from the mutation hook. The draft is KEPT so a retry reuses the key. */
    } finally {
      setSettled(true);
    }
  };

  const showResult = !overlay && (isSuccess || isError);
  const step = showResult ? 4 : draft.recipient ? draft.step : 1;

  const backToForm = (nextStep) => {
    reset();
    dispatch(goToStep(nextStep));
  };
  const startOver = () => {
    reset();
    dispatch(resetDraft());
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Send money</h1>
      <TransferStepper current={step} />

      <Card className="rounded-3xl shadow-elev-2">
        <CardContent className="p-6 sm:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduced ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: -24 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
            >
              {step === 1 && <RecipientStep initialQuery={params.get("q") ?? ""} />}
              {step === 2 && <AmountStep />}
              {step === 3 && <ReviewStep onConfirm={submit} submitting={overlay} />}
              {step === 4 && (
                <ResultCard
                  data={data}
                  error={error}
                  isSuccess={isSuccess}
                  onSendAnother={startOver}
                  onDone={() => {
                    reset();
                    navigate("/app/dashboard");
                  }}
                  onRetry={submit}
                  onChangeAmount={() => backToForm(2)}
                  onChooseRecipient={() => backToForm(1)}
                  onStartOver={startOver}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {overlay && <ProcessingOverlay settled={settled} onDone={() => setOverlay(false)} />}
    </div>
  );
}
