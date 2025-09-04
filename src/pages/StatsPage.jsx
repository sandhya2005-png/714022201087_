// ============================ src/pages/StatsPage.jsx ============================
import React, { useMemo, useState } from "react";
import {
  Card, CardContent, CardHeader, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Stack, Chip, Collapse, IconButton, Tooltip, Divider, Button, Dialog, DialogTitle, DialogContent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LaunchIcon from "@mui/icons-material/Launch";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useStore } from "../store";
import { fmtDate, isExpired } from "../utils";
import { getAllLogs, clearLogs } from "../logging/middleware";

function RowClicks({ code, rows }) {
  return (
    <Table size="small" sx={{ mt: 1 }}>
      <TableHead>
        <TableRow>
          <TableCell>Timestamp</TableCell>
          <TableCell>Source</TableCell>
          <TableCell>Coarse Location</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={3}>No clicks yet</TableCell></TableRow>
        ) : (
          rows.map((c, i) => (
            <TableRow key={i}>
              <TableCell>{fmtDate(c.timestamp)}</TableCell>
              <TableCell>{c.source || "Direct"}</TableCell>
              <TableCell>{c.location || "Unknown"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default function StatsPage() {
  const { getAllLinks, getClicks } = useStore();
  const [openCode, setOpenCode] = useState(null);
  const links = getAllLinks();

  const rows = useMemo(() => links.map((l) => ({
    ...l,
    clickCount: getClicks(l.code).length,
  })), [links]);

  const [logsOpen, setLogsOpen] = useState(false);
  const logs = getAllLogs();

  return (
    <Card>
      <CardHeader title="Short Links – Statistics" subheader="Click a short URL to test redirection and logging. Expand a row to see detailed click data." />
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Short URL</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total Clicks</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <React.Fragment key={r.code}>
                <TableRow hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={`http://localhost:3000/${r.code}`}
                        onClick={() => window.open(`http://localhost:3000/${r.code}`, "_blank")}
                        onDelete={() => setOpenCode(openCode === r.code ? null : r.code)}
                        deleteIcon={<ExpandMoreIcon />}
                        variant="outlined"
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>{fmtDate(r.createdAt)}</TableCell>
                  <TableCell>{fmtDate(r.expiresAt)}</TableCell>
                  <TableCell>
                    {isExpired(r.expiresAt) ? (
                      <Chip label="Expired" color="error" size="small" />
                    ) : (
                      <Chip label="Active" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right"><strong>{r.clickCount}</strong></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Open">
                      <IconButton onClick={() => window.open(`http://localhost:3000/${r.code}`, "_blank")}>
                        <LaunchIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View logs">
                      <IconButton onClick={() => setLogsOpen(true)}>
                        <AssessmentIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0 }}>
                    <Collapse in={openCode === r.code} timeout="auto" unmountOnExit>
                      <Divider />
                      <RowClicks code={r.code} rows={getClicks(r.code)} />
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>No short links yet. Create some on the Shortener page.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={logsOpen} onClose={() => setLogsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>App Logs (via Logging Middleware)</DialogTitle>
          <DialogContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Payload Keys</TableCell>
                  <TableCell>Route</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow><TableCell colSpan={4}>No logs yet</TableCell></TableRow>
                ) : (
                  logs.slice().reverse().map((log, i) => (
                    <TableRow key={i}>
                      <TableCell>{fmtDate(log.ts)}</TableCell>
                      <TableCell>{log.type}</TableCell>
                      <TableCell>{Array.isArray(log.payloadShape) ? log.payloadShape.join(", ") : ""}</TableCell>
                      <TableCell>{log.route}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={() => { clearLogs(); window.location.reload(); }}>
                Clear Logs
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

