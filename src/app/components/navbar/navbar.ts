import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
//================================
import { ChatService } from '../../services/chat.service';
//================================

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  // Público para usarlo en la plantilla: auth.user(), auth.isAdmin(), auth.logout()
  auth = inject(AuthService);
//================================
  private readonly chatService = inject(ChatService);
  private subscriptions = new Subscription();
  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly notificationMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.subscriptions.add(
      this.chatService.userConnected$.subscribe(() => {
        this.showNotification('Un usuario se ha conectado');
      })
    );

    this.subscriptions.add(
      this.chatService.userDisconnected$.subscribe(() => {
        this.showNotification('Un usuario se ha desconectado');
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  private showNotification(message: string): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notificationMessage.set(message);
    this.notificationTimeout = setTimeout(() => {
      this.notificationMessage.set(null);
    }, 4000);
  }
//================================
}