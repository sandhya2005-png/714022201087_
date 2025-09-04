
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, Typography, LinearProgress, Stack, Alert, Button } from "@mui/material";
import { useStore } from "../store";
import { getCoarseLocation, isExpired, nowISO } from "../utils";

export default function Redirector() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { getLink, addClick } = useStore();
  const [status, setStatus] = useState("checking"); // checking | ok | missing | expired
  const link = useMemo(() => getLink(code), [code, getLink]);

  useEffect(() => {
    if (!link) {
      setStatus("missing");
      return;
    }
    if (isExpired(link.expiresAt)) {
      setStatus("expired");
      return;
    }
    setStatus("ok");

    // record click before redirect
    const click = {
      timestamp: nowISO(),
      source: document.referrer || "Direct",
      location: getCoarseLocation(),
    };
    addClick(code, click);

    // perform redirect
    const t = setTimeout(() => {
      window.location.href = link.url;
    }, 600);
    return () => clearTimeout(t);
  }, [code, link, addClick]);

  if (status === "checking") {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Resolving short link…</Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (status === "missing") {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="error">Short link not found for code “{code}”.</Alert>
            <Button variant="contained" onClick={() => navigate("/")}>Create a new short link</Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (status === "expired") {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="warning">This short link has expired.</Alert>
            <Button variant="contained" onClick={() => navigate("/")}>Create a new short link</Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // status ok: show progress while redirecting
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Redirecting to destination…</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </CardContent>
    </Card>
  );
}

