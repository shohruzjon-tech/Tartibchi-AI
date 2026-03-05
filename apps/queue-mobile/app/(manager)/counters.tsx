import React from "react";
import { CrudListScreen } from "@/src/components/CrudListScreen";
import { api } from "@/src/services/api";
import { CounterForm } from "@/src/components/forms/CounterForm";
import { useAppSelector } from "@/src/store";

export default function ManagerCountersScreen() {
  const { token } = useAppSelector((s) => s.auth);

  return (
    <CrudListScreen
      titleKey="sidebar.counters"
      fetchFn={() => api.counters.list({}, token!)}
      createFn={(data) => api.counters.create(data, token!)}
      updateFn={(id, data) => api.counters.update(id, data, token!)}
      deleteFn={(id) => api.counters.delete(id, token!)}
      FormComponent={CounterForm}
      getItemTitle={(item) => item.name ?? "Counter"}
      getItemSubtitle={(item) => item.queueName ?? ""}
    />
  );
}
