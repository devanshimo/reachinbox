import {
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { createCampaign } from "../api/campaign";



function Compose() {
  const SENDER_ID = "cmt4348p300012wqmcih8m7cv";
  const navigate = useNavigate();

  const [recipients, setRecipients] =
    useState<string[]>([]);
  const [recipientInput, setRecipientInput] =
    useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [delaySeconds, setDelaySeconds] =
    useState(10);
  const [hourlyLimit, setHourlyLimit] =
    useState(100);
  const [startTime, setStartTime] =
    useState("");

  const [sending, setSending] =
    useState(false);
  const [showSchedule, setShowSchedule] =
    useState(false);
  const [uploadCount, setUploadCount] =
    useState(0);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const addRecipient = () => {
    const email =
      recipientInput.trim();

    if (!email) return;

    if (!recipients.includes(email)) {
      setRecipients((current) => [
        ...current,
        email,
      ]);
    }

    setRecipientInput("");
  };

  const removeRecipient = (
    email: string,
  ) => {
    setRecipients((current) =>
      current.filter(
        (recipient) =>
          recipient !== email,
      ),
    );
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      const text = String(
        reader.result ?? "",
      );

      const emails = text
        .split(/[\s,;\n\r]+/)
        .map((value) =>
          value.trim(),
        )
        .filter((value) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            value,
          ),
        );

      const uniqueEmails = [
        ...new Set(emails),
      ];

      setRecipients(
        uniqueEmails,
      );
      setUploadCount(
        uniqueEmails.length,
      );
    };

    reader.readAsText(file);
  };

  const handleSend = async () => {
    if (!SENDER_ID) {
      alert(
        "No sender account is available.",
      );
      return;
    }

    if (
      recipients.length === 0 ||
      !subject.trim() ||
      !body.trim()
    ) {
      alert(
        "Please fill in recipients, subject and body.",
      );
      return;
    }

    try {
      setSending(true);

      await createCampaign({
        senderId: SENDER_ID,
        recipients,
        subject,
        body,
        startTime: startTime
          ? new Date(
              startTime,
            ).toISOString()
          : new Date().toISOString(),
        delaySeconds,
        hourlyLimit,
      });

      alert(
        "Campaign scheduled successfully.",
      );

      setRecipients([]);
      setRecipientInput("");
      setSubject("");
      setBody("");
      setStartTime("");
      setShowSchedule(false);
      setUploadCount(0);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }

      navigate("/scheduled");
    } catch (error) {
      console.error(error);
      alert(
        "Failed to create campaign.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="compose-page">
      <div className="compose-header">
        <button
          className="compose-title"
          onClick={() =>
            navigate("/scheduled")
          }
          type="button"
        >
          ← &nbsp; Compose New Email
        </button>

        <div className="compose-actions">
          <button
            className="send-later-button"
            type="button"
            onClick={() =>
              setShowSchedule(
                !showSchedule,
              )
            }
          >
            Send Later
          </button>

          <button
            className="send-button"
            onClick={handleSend}
            disabled={
              sending ||
              !SENDER_ID
            }
            type="button"
          >
            {sending
              ? "Sending..."
              : "Send"}
          </button>
        </div>

        {showSchedule && (
          <div className="schedule-popup">
            <div className="schedule-popup-title">
              Send Later
            </div>

            <label>
              Pick date & time
            </label>

            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) =>
                setStartTime(
                  e.target.value,
                )
              }
            />

            <div className="schedule-actions">
              <button
                type="button"
                onClick={() =>
                  setShowSchedule(
                    false,
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowSchedule(
                    false,
                  )
                }
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="compose-content">
        <div className="compose-row">
          <span className="compose-label">
            From
          </span>

          <div className="sender-chip">oliver.brown@domain.io</div>
        </div>

        <div className="compose-row">
          <span className="compose-label">
            To
          </span>

          <div className="recipient-area">
            {recipients.map(
              (email) => (
                <span
                  className="recipient-chip"
                  key={email}
                >
                  {email}

                  <button
                    type="button"
                    onClick={() =>
                      removeRecipient(
                        email,
                      )
                    }
                  >
                    ×
                  </button>
                </span>
              ),
            )}

            <input
              className="recipient-input"
              type="email"
              placeholder={
                recipients.length ===
                0
                  ? "recipient@example.com"
                  : "Add recipient"
              }
              value={
                recipientInput
              }
              onChange={(e) =>
                setRecipientInput(
                  e.target.value,
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key ===
                    "Enter" ||
                  e.key === ","
                ) {
                  e.preventDefault();
                  addRecipient();
                }
              }}
              onBlur={
                addRecipient
              }
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={
              handleFileUpload
            }
          />

          <button
            className="upload-list"
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            ↑ &nbsp; Upload List
          </button>
        </div>

        {uploadCount > 0 && (
          <div className="ml-[70px] mt-[-10px] mb-4 text-sm text-gray-500">
            {uploadCount} email
            {uploadCount !== 1
              ? "s"
              : ""}{" "}
            detected
          </div>
        )}

        <div className="compose-row">
          <span className="compose-label">
            Subject
          </span>

          <input
            className="compose-input"
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) =>
              setSubject(
                e.target.value,
              )
            }
          />
        </div>

        <div className="compose-settings">
          <div className="setting">
            <span>
              Delay between 2 emails
            </span>

            <input
              type="number"
              min="0"
              value={
                delaySeconds
              }
              onChange={(e) =>
                setDelaySeconds(
                  Number(
                    e.target.value,
                  ),
                )
              }
            />
          </div>

          <div className="setting">
            <span>
              Hourly Limit
            </span>

            <input
              type="number"
              min="1"
              value={
                hourlyLimit
              }
              onChange={(e) =>
                setHourlyLimit(
                  Number(
                    e.target.value,
                  ),
                )
              }
            />
          </div>
        </div>

        <div className="editor-toolbar">
          <button type="button">
            ↶
          </button>
          <button type="button">
            ↷
          </button>
          <button type="button">
            T
          </button>
          <button type="button">
            B
          </button>
          <button type="button">
            I
          </button>
          <button type="button">
            U
          </button>
          <button type="button">
            ≡
          </button>
          <button type="button">
            ☷
          </button>
          <button type="button">
            ❝
          </button>
          <button type="button">
            🔗
          </button>
        </div>

        <textarea
          className="email-editor"
          placeholder="Type your reply..."
          value={body}
          onChange={(e) =>
            setBody(
              e.target.value,
            )
          }
        />

        {startTime && (
          <div className="scheduled-preview">
            Scheduled for{" "}
            {new Date(
              startTime,
            ).toLocaleString()}
          </div>
        )}

        <div className="schedule-control">
          <label>
            Schedule time
          </label>

          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) =>
              setStartTime(
                e.target.value,
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

export default Compose;
