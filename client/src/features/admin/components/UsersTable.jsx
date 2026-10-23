import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";
import UserStatusBadge from "./UserStatusBadge";

export default function UsersTable({ users, onToggleStatus }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} className="hover:bg-muted">
              <TableCell>
                <Link to={`/admin/users/${u.id}`} className="font-medium text-foreground hover:underline">
                  {u.name}
                </Link>
              </TableCell>
              <TableCell className="text-foreground/80">{u.email}</TableCell>
              <TableCell>
                <UserStatusBadge status={u.status} />
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{u.accountNumberMasked ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(u.createdAt)}</TableCell>
              <TableCell>
                {/* modal={false}: avoids Radix leaving the page un-clickable when a dialog opens from a menu item */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Actions for ${u.name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/admin/users/${u.id}`}>View details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onToggleStatus(u)}
                      className={u.status === "ACTIVE" ? "text-danger focus:text-danger" : ""}
                    >
                      {u.status === "ACTIVE" ? "Suspend…" : "Activate…"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
