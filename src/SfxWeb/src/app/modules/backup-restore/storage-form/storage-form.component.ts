import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-storage-form',
  templateUrl: './storage-form.component.html',
  styleUrls: ['./storage-form.component.scss']
})
export class StorageFormComponent implements OnInit {

  @Input() form: FormGroup;
  @Input() data: any;
  @Input() required = true;

  localForm: FormGroup;
  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.localForm = this.formBuilder.group({
      StorageKind: ['', [Validators.required]],
      FriendlyName: [''],
      Path: [''],
      ConnectionString: [''],
      ContainerName: [''],
      PrimaryUserName: [''],
      PrimaryPassword: [''],
      SecondaryUserName: [''],
      SecondaryPassword: ['']
    });

    this.form.addControl('Storage', this.localForm);

    this.localForm.get('StorageKind').valueChanges.subscribe(storageKind => {
      if (this.required) {
        this.updateStorageKindValidators(this.localForm, storageKind);
      }
    });

    // set default data or if none then give it a default state;
    this.data = this.data || {
      StorageKind: 'AzureBlobStore',
      FriendlyName: '',
      Path: '',
      ConnectionString: '',
      ContainerName: '',
      PrimaryUserName: '',
      PrimaryPassword: '',
      SecondaryUserName: '',
      SecondaryPassword: ''
    };
    this.localForm.patchValue(this.data);

    if (this.required) {
      this.localForm.get('ContainerName').setValidators(null);
      this.localForm.get('ConnectionString').setValidators(null);
      this.localForm.get('Path').setValidators(null);
    }
  }

  updateStorageKindValidators(storage: AbstractControl, storageKind: string) {
    if (storageKind === 'AzureBlobStore') {
      storage.get('ContainerName').setValidators([Validators.required]);
      storage.get('ConnectionString').setValidators([Validators.required]);

      storage.get('Path').setValidators(null);
    }

    if (storageKind === 'FileShare') {
      storage.get('ContainerName').setValidators(null);
      storage.get('ConnectionString').setValidators(null);

      storage.get('Path').setValidators([Validators.required]);
    }

    storage.get('ContainerName').updateValueAndValidity();
    storage.get('ConnectionString').updateValueAndValidity();
    storage.get('Path').updateValueAndValidity();
  }

}
