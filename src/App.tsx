import { DragDropProvider } from "@dnd-kit/react";
import { type ComponentProps, useCallback, useEffect } from "react";
import LoginButton from "./components/Auth/LoginButton";
import EmailList from "./components/EmailList/EmailList";
import Layout from "./components/Layout/Layout";
import Loader from "./components/Loader/Loader";
import Sidebar from "./components/Sidebar/Sidebar";
import { useAuth } from "./context/AuthContext";
import { useEmails } from "./context/EmailContext";

type DragEndHandler = NonNullable<ComponentProps<typeof DragDropProvider>["onDragEnd"]>;

function InboxView() {
  const { fetchEmails, fetchCategories, moveEmail } = useEmails();

  useEffect(() => {
    fetchCategories();
    fetchEmails();
  }, [fetchCategories, fetchEmails]);

  const handleDragEnd: DragEndHandler = useCallback(
    (event) => {
      const { operation } = event;
      if (!operation) return;

      const { source, target } = operation;
      if (!source || !target) return;

      const emailData = source.data;
      if (!emailData?.emailId) return;

      const newCategoryId = target.id as string;
      if (newCategoryId === emailData.currentCategoryId) return;

      moveEmail(emailData.emailId, newCategoryId);
    },
    [moveEmail]
  );

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <Layout>
        <Sidebar />
        <EmailList />
      </Layout>
    </DragDropProvider>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <LoginButton />;
  }

  return <InboxView />;
}
