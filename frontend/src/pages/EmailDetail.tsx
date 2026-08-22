import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEmails, type Email } from "../api/email";

function EmailDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmail = async () => {
      try {
        // Fetch both lists because the same detail page handles
        // scheduled and sent emails.
        const [scheduled, sent] = await Promise.all([
          getEmails("SCHEDULED"),
          getEmails("SENT"),
        ]);

        const found = [...scheduled, ...sent].find(
          (item) => item.id === id,
        );

        setEmail(found ?? null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadEmail();
  }, [id]);

  if (loading) {
    return (
      <div className="email-detail-page">
        <div className="empty-state">Loading...</div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="email-detail-page">
        <button
          className="detail-back"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="empty-state">
          Email not found
        </div>
      </div>
    );
  }

  return (
    <div className="email-detail-page">
      <button
        className="detail-back"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="email-detail-card">
        <div className="email-detail-header">
          <div>
            <h1>{email.subject}</h1>

            <div className="detail-recipient">
              To: {email.recipient}
            </div>
          </div>

          <span
            className={`detail-status ${email.status.toLowerCase()}`}
          >
            {email.status}
          </span>
        </div>

        <div className="detail-meta">
          <span>
            From: oliver.brown@domain.io
          </span>

          <span>
            {email.sentAt
              ? `Sent ${new Date(
                  email.sentAt,
                ).toLocaleString()}`
              : `Scheduled ${new Date(
                  email.scheduledAt,
                ).toLocaleString()}`}
          </span>
        </div>

        <div className="detail-divider" />

        <div className="email-detail-body">
          {email.body}
        </div>
      </div>
    </div>
  );
}

export default EmailDetail;