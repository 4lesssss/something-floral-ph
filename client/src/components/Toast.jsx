import { useEffect, useState } from "react";

let showToastFn = () => {};

export function toast(message) {
  showToastFn(message);
}

export default function Toast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    showToastFn = (msg) => {
      setMessage(msg);
      setVisible(true);
      setTimeout(() => setVisible(false), 3000);
    };
  }, []);

  return (
    <div id="sfToast" className={`toast${visible ? " show" : ""}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
