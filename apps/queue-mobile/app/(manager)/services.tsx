import React from "react";
import { CrudListScreen } from "@/src/components/CrudListScreen";
import { api } from "@/src/services/api";
import { QueueForm } from "@/src/components/forms/QueueForm";
import { useAppSelector } from "@/src/store";

export default function ManagerServicesScreen() {
  const { token } = useAppSelector((s) => s.auth);

  return (
    <CrudListScreen
      titleKey="sidebar.services"
      fetchFn={() => api.queues.list({})}
      createFn={(data) => api.queues.create(data, token!)}
      updateFn={(id, data) => api.queues.update(id, data, token!)}
      deleteFn={(id) => api.queues.delete(id, token!)}
      FormComponent={QueueForm}
      getItemTitle={(item) => item.name ?? "Service"}
      getItemSubtitle={(item) => item.strategy ?? ""}
    />
  );
}
