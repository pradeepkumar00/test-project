import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  template: `
    <div class="redirect">Redirecting to login...</div>
  `,
  styles: [`
    .redirect {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 15px;
    }
  `],
})
export class RegisterComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const refer = this.route.snapshot.queryParamMap.get('refer');
    this.router.navigate(['/login'], {
      queryParams: refer ? { refer } : {},
      replaceUrl: true,
    });
  }
}
