import { DragDropProvider } from "@dnd-kit/react";
import { useCallback, useEffect } from "react";
import LoginButton from "./components/Auth/LoginButton";
import EmailList from "./components/EmailList/EmailList";
import Layout from "./components/Layout/Layout";
import Sidebar from "./components/Sidebar/Sidebar";
import { useAuth } from "./context/AuthContext";
import { useEmails } from "./context/EmailContext";

function InboxView() {
  const { fetchEmails, fetchCategories, moveEmail } = useEmails();

  useEffect(() => {
    fetchCategories();
    fetchEmails();
  }, [fetchCategories, fetchEmails]);

  const handleDragEnd = useCallback(
    (event: any) => {
      const { operation } = event;
      if (!operation) return;

      const { source, target } = operation;
      if (!source || !target) return;

      const emailData = source.data;
      if (!emailData?.classificationId) return;

      const newCategoryId = target.id as string;
      if (newCategoryId === emailData.currentCategoryId) return;

      moveEmail(emailData.emailId, emailData.classificationId, newCategoryId);
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
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ color: "var(--text-secondary)" }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginButton />;
  }

  return <InboxView />;
}
