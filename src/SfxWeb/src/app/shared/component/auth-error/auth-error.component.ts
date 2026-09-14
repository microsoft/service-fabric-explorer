import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MsalService } from '../../../services/msal.service';
import { AadMetadata } from '../../../Models/DataModels/Aad';

@Component({
    selector: 'app-auth-error',
    templateUrl: './auth-error.component.html',
    styleUrls: ['./auth-error.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class AuthErrorComponent {
  private msalService = inject(MsalService);

  // AADSTS9002326: reply URL registered as "Web" instead of "Single-page application".
  readonly spaRegistrationErrorCode = '9002326';
  readonly redirectUri = window.location.origin + window.location.pathname;

  get errorCode(): string | null {
    return this.msalService.authErrorCode;
  }

  get isSpaRegistrationError(): boolean {
    return this.errorCode === this.spaRegistrationErrorCode;
  }

  get clientId(): string {
    // config is undefined until AAD metadata loads, so guard against reads before then.
    const config: AadMetadata | undefined = this.msalService.config;
    return config?.metadata?.cluster ?? '';
  }
}
