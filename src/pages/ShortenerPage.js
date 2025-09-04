// ============================ src/pages/ShortenerPage.jsx ============================
import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Typography,
  Button,
  Stack,
  Alert,
  Snackbar,
  Chip,
  Divider,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useStore } from "../store";
import { isValidUrl, isValidShortcode, fmtDate } from "../utils";

function UrlRow({ index, value, onChange }) {
  const [errors, setErrors] = useState({});

  function handleChange(field, v) {
    const next = { ...value, [field]: v };
    onChange(index, next);
    // realtime light validation
    const e = {};
    if (next.url && !isValidUrl(next.url)) e.url = "Invalid URL";
    if (next.customCode && !isValidShortcode(next.customCode)) e.customCode = "Alphanumeric, 4-32";
    if (next.validityMins && (!Number.isInteger(Number(next.validityMins)) || Number(next.validityMins) <= 0)) e.validityMins = "Positive integer";
    setErrors(e);
  }

  return (
    <Grid container spacing={2} sx={{ mb: 1 }}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={`Long URL #${index + 1}`}
          value={value.url}
          onChange={(e) => handleChange("url", e.target.value)}
          error={!!errors.url}
          helperText={errors.url || "e.g., https://www.affordmed.com"}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          label="Validity (minutes)"
          value={value.validityMins}
          onChange={(e) => handleChange("validityMins", e.target.value)}
          error={!!errors.validityMins}
          helperText={errors.validityMins || "Default: 30"}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          label="Custom shortcode (optional)"
          value={value.customCode}
          onChange={(e) => handleChange("customCode", e.target.value)}
          error={!!errors.customCode}
          helperText={errors.customCode || "Alphanumeric only"}
        />
      </Grid>
    </Grid>
  );
}

export default function ShortenerPage() {
  const { createMany } = useStore();
  const [rows, setRows] = useState(
    Array.from({ length: 5 }, () => ({ url: "", validityMins: "", customCode: "" }))
  );
  const [result, setResult] = useState([]);
  const [errors, setErrors] = useState([]);
  const [snack, setSnack] = useState({ open: false, msg: "" });

  const canSubmit = useMemo(
    () => rows.some((r) => r.url.trim() !== ""),
    [rows]
  );

  function updateRow(idx, next) {
    const copy = rows.slice();
    copy[idx] = next;
    setRows(copy);
  }

  function handleShorten() {
    const payload = rows
      .filter((r) => r.url.trim() !== "")
      .map((r) => ({
        url: r.url.trim(),
        validityMins: r.validityMins === "" ? null : Number(r.validityMins),
        customCode: r.customCode.trim() || null,
      }));

    const { results, errors: errs } = createMany(payload);
    setResult(results);
    setErrors(errs);

    if (results.length > 0) {
      setSnack({ open: true, msg: `Created ${results.length} short link(s)` });
    }
    if (errs.length > 0) {
      setSnack({ open: true, msg: `Encountered ${errs.length} error(s)` });
    }
  }

  function host() {
    return "http://localhost:3000";
  }

  function copyToClipboard(text) {
    // Use Clipboard API without console
    navigator.clipboard?.writeText(text);
    setSnack({ open: true, msg: "Copied to clipboard" });
  }

  return (
    <Card elevation={1}>
      <CardHeader title="URL Shortener" subheader="Shorten up to 5 URLs at once. Default validity: 30 minutes." />
      <CardContent>
        <Stack spacing={2}>
          {rows.map((row, idx) => (
            <UrlRow key={idx} index={idx} value={row} onChange={updateRow} />
          ))}
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleShorten} disabled={!canSubmit}>
              Create Short Links
            </Button>
            <Button variant="text" onClick={() => { setRows(Array.from({ length: 5 }, () => ({ url: "", validityMins: "", customCode: "" }))); setResult([]); setErrors([]); }}>
              Reset
            </Button>
          </Stack>

          {(result.length > 0 || errors.length > 0) && <Divider />}

          {result.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="h6">Results</Typography>
              {result.map((r) => {
                const shortUrl = `${host()}/${r.code}`;
                return (
                  <Card key={r.code} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Original URL
                      </Typography>
                      <Typography variant="body1" sx={{ wordBreak: "break-all" }}>{r.url}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Chip label={`Short: ${shortUrl}`} variant="outlined" onClick={() => window.open(shortUrl, "_blank")} />
                        <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => copyToClipboard(shortUrl)}>
                          Copy
                        </Button>
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Expires: <strong>{fmtDate(r.expiresAt)}</strong>
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}

          {errors.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="h6">Errors</Typography>
              {errors.map((e, i) => (
                <Alert key={i} severity="error">Row #{(e.index ?? 0) + 1}: {e.message}</Alert>
              ))}
            </Stack>
          )}

          <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ open: false, msg: "" })}>
            <Alert severity="info" variant="filled">{snack.msg}</Alert>
          </Snackbar>
        </Stack>
      </CardContent>
    </Card>
  );
}

