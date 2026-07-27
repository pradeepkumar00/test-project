import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { Admin, AdminPermission } from '../../core/models';
import { ADMIN_PERMISSIONS, permissionsByGroup } from '../../core/constants/permissions';

@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Admins</h1>
      <button class="btn btn-primary" (click)="openCreate()">+ Create Admin</button>
    </div>

    <p class="hint">
      Superadmin has full access. Regular admins only see and do what you assign below.
    </p>

    @if (error) { <div class="alert error">{{ error }}</div> }
    @if (message) { <div class="alert success">{{ message }}</div> }

    @if (loading) { <div class="spinner">Loading...</div> }
    @else if (!admins.length) { <div class="empty">No admins found</div> }
    @else {
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Role</th>
              <th>Permissions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (a of admins; track a.id) {
              <tr>
                <td>{{ a.name || '—' }}</td>
                <td>{{ a.mobile }}</td>
                <td>
                  <span class="badge" [class.badge-approved]="a.role === 'superadmin'" [class.badge-pending]="a.role === 'admin'">
                    {{ a.role }}
                  </span>
                </td>
                <td>
                  @if (a.role === 'superadmin') {
                    <small>All access</small>
                  } @else {
                    <small>{{ (a.permissions || []).length }} assigned</small>
                  }
                </td>
                <td>
                  <span class="badge" [class.badge-approved]="a.isActive" [class.badge-rejected]="!a.isActive">
                    {{ a.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    @if (a.role === 'admin' || a.id === currentAdminId) {
                      <button class="btn btn-outline btn-sm" (click)="openEdit(a)">Edit</button>
                    }
                    @if (a.role === 'admin' && a.id !== currentAdminId) {
                      <button
                        class="btn btn-danger btn-sm"
                        [disabled]="deletingId === a.id"
                        (click)="deleteAdmin(a)"
                      >
                        {{ deletingId === a.id ? 'Deleting...' : 'Delete' }}
                      </button>
                    }
                    @if (a.role === 'superadmin' && a.id !== currentAdminId) {
                      <small class="muted">Protected</small>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (panelOpen) {
      <div class="modal-backdrop" (click)="closePanel()">
        <div class="modal wide" (click)="$event.stopPropagation()">
          <h3>{{ editing ? 'Edit Admin' : 'Create Admin' }}</h3>

          @if (!editing) {
            <div class="form-group">
              <label>Mobile</label>
              <input [(ngModel)]="form.mobile" maxlength="10" placeholder="10-digit mobile" />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" [(ngModel)]="form.password" placeholder="Min 6 characters" />
            </div>
          }

          <div class="form-group">
            <label>Name</label>
            <input [(ngModel)]="form.name" placeholder="Display name" />
          </div>

          @if (editing && editing.role === 'admin') {
            <div class="form-group">
              <label>New password (optional)</label>
              <input type="password" [(ngModel)]="form.password" placeholder="Leave blank to keep" />
            </div>
            <div class="form-group row">
              <label>
                <input type="checkbox" [(ngModel)]="form.isActive" /> Active
              </label>
            </div>
          }

          @if (!editing || editing.role === 'admin') {
            <div class="perm-head">
              <strong>Permissions</strong>
              <div class="perm-actions">
                <button type="button" class="btn btn-outline btn-sm" (click)="selectAll()">Select all</button>
                <button type="button" class="btn btn-outline btn-sm" (click)="clearAll()">Clear</button>
              </div>
            </div>

            @for (group of permissionGroups; track group.name) {
              <div class="perm-group">
                <h4>{{ group.name }}</h4>
                @for (p of group.items; track p.key) {
                  <label class="perm-item">
                    <input
                      type="checkbox"
                      [checked]="form.permissions.includes(p.key)"
                      (change)="togglePerm(p.key, $event)"
                    />
                    <span>
                      <strong>{{ p.label }}</strong>
                      <small>{{ p.description }}</small>
                    </span>
                  </label>
                }
              </div>
            }
          } @else {
            <p class="muted">Superadmin always has full access.</p>
          }

          @if (panelError) { <p class="reject-error">{{ panelError }}</p> }

          <div class="modal-actions">
            <button class="btn btn-outline" (click)="closePanel()">Cancel</button>
            <button class="btn btn-primary" [disabled]="saving" (click)="save()">
              {{ saving ? 'Saving...' : (editing ? 'Save changes' : 'Create admin') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .hint { color: var(--text-muted); margin: -8px 0 16px; font-size: 13px; }
    .muted { color: var(--text-muted); }
    .alert {
      padding: 10px 12px; border-radius: 10px; margin-bottom: 12px; font-size: 13px;
    }
    .alert.error { background: rgba(239,68,68,0.15); color: #fda4af; }
    .alert.success { background: rgba(34,197,94,0.15); color: #86efac; }
    .modal.wide { max-width: 640px; max-height: 88vh; overflow: auto; }
    .perm-head {
      display: flex; align-items: center; justify-content: space-between;
      margin: 12px 0 8px;
    }
    .perm-actions { display: flex; gap: 8px; }
    .perm-group {
      border: 1px solid var(--border); border-radius: 10px;
      padding: 10px 12px; margin-bottom: 10px;
    }
    .perm-group h4 { margin: 0 0 8px; font-size: 13px; color: var(--primary-light); }
    .perm-item {
      display: flex; gap: 10px; align-items: flex-start;
      margin-bottom: 8px; cursor: pointer; font-size: 13px;
      text-align: left;
    }
    .perm-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      min-width: 18px;
      padding: 0;
      margin: 2px 0 0;
      flex-shrink: 0;
      accent-color: var(--primary);
      border-radius: 4px;
      cursor: pointer;
    }
    .perm-item span { flex: 1; min-width: 0; }
    .perm-item strong { display: block; }
    .perm-item small { color: var(--text-muted); font-size: 11px; }
    .row label { display: flex; align-items: center; gap: 8px; }
    .row input[type="checkbox"] {
      width: 18px; height: 18px; min-width: 18px; padding: 0; flex-shrink: 0;
    }
    .reject-error { color: #fda4af; font-size: 13px; margin-bottom: 12px; }
  `],
})
export class AdminsComponent implements OnInit {
  private api = inject(AdminApiService);
  private auth = inject(AuthService);

  admins: Admin[] = [];
  loading = true;
  error = '';
  message = '';
  panelOpen = false;
  editing: Admin | null = null;
  saving = false;
  deletingId = '';
  panelError = '';
  currentAdminId = this.auth.getAdmin()?.id || '';

  form = {
    mobile: '',
    password: '',
    name: '',
    isActive: true,
    permissions: [] as string[],
  };

  permissionGroups = Object.entries(permissionsByGroup()).map(([name, items]) => ({
    name,
    items: items as AdminPermission[],
  }));

  ngOnInit() {
    this.load();
    this.api.getPermissionCatalog().subscribe({
      next: (r) => {
        const grouped: Record<string, AdminPermission[]> = {};
        for (const p of r.permissions) {
          if (!grouped[p.group]) grouped[p.group] = [];
          grouped[p.group].push(p);
        }
        this.permissionGroups = Object.entries(grouped).map(([name, items]) => ({ name, items }));
      },
      error: () => {
        // fallback to local catalog
        this.permissionGroups = Object.entries(permissionsByGroup()).map(([name, items]) => ({
          name,
          items: items as unknown as AdminPermission[],
        }));
      },
    });
  }

  load() {
    this.loading = true;
    this.error = '';
    this.api.getAdmins().subscribe({
      next: (r) => {
        this.admins = r.admins;
        this.loading = false;
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to load admins';
        this.loading = false;
      },
    });
  }

  openCreate() {
    this.editing = null;
    this.form = { mobile: '', password: '', name: '', isActive: true, permissions: [] };
    this.panelError = '';
    this.panelOpen = true;
  }

  openEdit(admin: Admin) {
    this.editing = admin;
    this.form = {
      mobile: admin.mobile,
      password: '',
      name: admin.name || '',
      isActive: admin.isActive !== false,
      permissions: [...(admin.permissions || [])],
    };
    this.panelError = '';
    this.panelOpen = true;
  }

  closePanel() {
    this.panelOpen = false;
    this.panelError = '';
  }

  togglePerm(key: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.form.permissions.includes(key)) this.form.permissions = [...this.form.permissions, key];
    } else {
      this.form.permissions = this.form.permissions.filter((p) => p !== key);
    }
  }

  selectAll() {
    this.form.permissions = ADMIN_PERMISSIONS.map((p) => p.key);
  }

  clearAll() {
    this.form.permissions = [];
  }

  deleteAdmin(admin: Admin) {
    if (admin.role !== 'admin') return;
    if (!confirm(`Delete admin ${admin.name || admin.mobile}? This cannot be undone.`)) return;

    this.error = '';
    this.message = '';
    this.deletingId = admin.id;
    this.api.deleteAdmin(admin.id).subscribe({
      next: (r) => {
        this.message = r.message || 'Admin deleted';
        this.deletingId = '';
        this.load();
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to delete admin';
        this.deletingId = '';
      },
    });
  }

  save() {
    this.panelError = '';
    this.saving = true;

    if (!this.editing) {
      if (!/^[6-9]\d{9}$/.test(this.form.mobile)) {
        this.panelError = 'Enter a valid 10-digit mobile';
        this.saving = false;
        return;
      }
      if (this.form.password.length < 6) {
        this.panelError = 'Password must be at least 6 characters';
        this.saving = false;
        return;
      }

      this.api
        .createAdmin({
          mobile: this.form.mobile,
          password: this.form.password,
          name: this.form.name,
          permissions: this.form.permissions,
        })
        .subscribe({
          next: (r) => {
            this.message = r.message;
            this.saving = false;
            this.closePanel();
            this.load();
          },
          error: (e) => {
            this.panelError = e.error?.message || 'Failed to create admin';
            this.saving = false;
          },
        });
      return;
    }

    const payload: Partial<{ name: string; permissions: string[]; isActive: boolean; password: string }> = {
      name: this.form.name,
    };
    if (this.editing.role === 'admin') {
      payload.permissions = this.form.permissions;
      payload.isActive = this.form.isActive;
    }
    if (this.form.password) payload.password = this.form.password;

    this.api.updateAdmin(this.editing.id, payload).subscribe({
      next: (r) => {
        this.message = r.message;
        this.saving = false;
        this.closePanel();
        this.load();
        if (this.editing?.id === this.currentAdminId) {
          this.auth.fetchProfile().subscribe();
        }
      },
      error: (e) => {
        this.panelError = e.error?.message || 'Failed to update admin';
        this.saving = false;
      },
    });
  }
}
