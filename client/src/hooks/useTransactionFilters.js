import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { hydrateFilters } from "@/features/transactions/transactionsFilterSlice";
import { parseFilters, serializeFilters } from "@/features/transactions/filterConfig";

/**
 * Two-way sync between the Redux filter slice and the URL.
 *   mount ............ URL → slice   (refresh, shared link)
 *   user changes UI .. slice → URL   (pushes a history entry → Back works)
 *   Back / Forward ... URL → slice
 * Both sides are compared as CANONICAL strings, so an update that changes nothing never loops.
 * `ready` stays false until the first URL → slice hydration, so we never fetch with default filters first.
 */
export function useTransactionFilters() {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.transactionsFilter);
  const [searchParams, setSearchParams] = useSearchParams();
  const [ready, setReady] = useState(false);

  const urlKey = serializeFilters(parseFilters(searchParams));
  const sliceKey = serializeFilters(filters);

  // 1) mount: URL → slice
  useEffect(() => {
    dispatch(hydrateFilters(parseFilters(searchParams)));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) the URL changed (Back/Forward, pasted link) → slice
  useEffect(() => {
    if (ready && urlKey !== sliceKey) dispatch(hydrateFilters(parseFilters(searchParams)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey]);

  // 3) the slice changed (a filter was clicked) → URL
  useEffect(() => {
    if (ready && sliceKey !== urlKey) setSearchParams(new URLSearchParams(sliceKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliceKey, ready]);

  return { ready };
}
