import { SVGIcon } from "@src/components";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ErrorNotificationData,
  InfoNotificationData,
  NotificationEvent,
} from "@src/types/notification.types";
import { useSelector } from "react-redux";
import { AppState } from "@src/_redux/_root";

interface NotificationProps extends NotificationEvent {
  id: string;
  removeNotification: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  data,
  duration = 5000,
  removeNotification,
}) => {
  const [progress, setProgress] = useState(100);
  const [mounted, setMounted] = useState(false);
  const progressTimerRef = useRef<NodeJS.Timeout>();
  const mountTimerRef = useRef<number>();
  const isPaused = useRef(false);
  const { editorInstance } = useSelector(
    (state: AppState) => state.main.editor,
  );

  const getToastColor = () => {
    if (type === "info") {
      const infoData = data as InfoNotificationData; // Type assertion since we know it's InfoNotificationData when type is "info"
      if (infoData.category === "success") {
        return "#4CAF50";
      } else if (infoData.category === "error") {
        return "#F44336";
      } else if (infoData.category === "warning") {
        return "#FFA726";
      } else {
        return "#2196F3";
      }
    }
    return "#2196F3"; // default color
  };

  const getToastIcon = () => {
    if (type === "info") {
      const infoData = data as InfoNotificationData; // Type assertion since we know it's InfoNotificationData when type is "info"
      switch (infoData.category) {
        case "success":
          return "checkbox";
        case "error":
          return "cross";
        case "warning":
          return "triangle";
        default:
          return "help";
      }
    }
    return "help";
  };

  const startProgressTimer = () => {
    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(progressTimerRef.current!);
          setTimeout(() => removeNotification(id), 0);
          return 0;
        }
        return prev - 100 / (duration / 100);
      });
    }, 100);
  };

  const handleMouseEnter = () => {
    isPaused.current = true;
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
  };

  const handleMouseLeave = () => {
    isPaused.current = false;
    startProgressTimer();
  };

  const handleParseErrorFix = useCallback(() => {
    if (type === "error") {
      const errorData = data as ErrorNotificationData;
      if (errorData.type !== "parse") return;

      const error = errorData.error;
      if (!error) return;

      if (!editorInstance) return;
      const model = editorInstance.getModel();
      if (!model) return;

      const content = model.getValue();
      const lines = content.split("\n");

      // Fix the specific error
      const line = lines[error.startLine - 1];
      const fixedLine =
        line.slice(0, error.startCol - 1) +
        ">" +
        line.slice(error.startCol - 1);
      lines[error.startLine - 1] = fixedLine;

      // Ensure the tag is properly closed
      const closingTag = `</h1>`;
      lines.splice(error.startLine, 0, closingTag);

      // const correctedContent = lines.join("\n");
      // model.setValue(correctedContent);
    }
  }, [editorInstance, type, data]);

  useEffect(() => {
    console.log("editorInstance", editorInstance);
  }, [editorInstance]);

  useEffect(() => {
    mountTimerRef.current = requestAnimationFrame(() => {
      setMounted(true);
    });

    startProgressTimer();

    return () => {
      if (mountTimerRef.current) {
        cancelAnimationFrame(mountTimerRef.current);
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [duration, id, removeNotification]);

  return (
    <div
      className="panel border radius-s"
      style={{
        minWidth: "250px",
        width: "100%",
        transform: `translateY(${mounted ? 0 : "100%"})`,
        opacity: mounted ? 1 : 0,
        transition: "transform 0.4s ease-out, opacity 0.4s ease-out",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="background-secondary padding-m gap-s align-center"
        style={{
          border: `1px solid ${getToastColor()}20`,
        }}
      >
        <div style={{ color: getToastColor() }}>
          <SVGIcon name={getToastIcon()} prefix="raincons" className="icon-s" />
        </div>
        <p>{data.message}</p>

        {/* <span
          style={{
            position: "absolute",
            top: "4px",
            right: "10px",
          }}
          onClick={() => removeNotification(id)}
        >
          &times;
        </span> */}
        {type === "error" && (
          <SVGIcon
            name="settings"
            prefix="raincons"
            className="icon-s"
            onClick={handleParseErrorFix}
          />
        )}

        <div
          className="radius-s"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "3px",
            width: `${progress}%`,
            backgroundColor: getToastColor(),
            transition: "width 0.1s linear",
          }}
        />
      </div>
    </div>
  );
};

export default Notification;
