import { useEffect, useState } from "react";
import { getEmails } from "../api/email";
import type { Email } from "../api/email";
import { useNavigate } from "react-router-dom";

function Sent() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const data = await getEmails("SENT");
      setEmails(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  return (
    <div className="inbox-page">
      <div className="inbox-toolbar">
        <div className="search-box">
          🔍&nbsp; Search
        </div>

        <button onClick={loadEmails}>↻</button>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : emails.length === 0 ? (
        <div className="empty-state">
          No sent emails
        </div>
      ) : (
        <div className="email-list">
          {emails.map((email) => (
            <div className="email-row" key={email.id} onClick={() => navigate(`/email/${email.id}`)}>
              <div className="email-recipient">
                To: {email.recipient}
              </div>

              <div className="email-time sent-time">
                {email.sentAt
                  ? new Date(
                      email.sentAt,
                    ).toLocaleString()
                  : ""}
              </div>

              <div className="email-subject">
                <strong>{email.subject}</strong>
                <span> - {email.body}</span>
              </div>

              <div className="email-star">
                ☆
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Sent;