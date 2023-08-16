import {Component, HostListener, NgZone, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {SunmiUHF} from "@kduma-autoid/capacitor-sunmi-uhf";
import {HandleableKey, KeyEvent, SunmiKeyboardHandler} from "@kduma-autoid/capacitor-sunmi-keyboard-handler";

@Component({
  selector: 'app-cracker',
  templateUrl: './cracker.page.html',
  styleUrls: ['./cracker.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CrackerPage implements OnInit, OnDestroy {

  scanning = signal<boolean>(false);
  cracking = false;
  epc = "";
  code = "00000000";

  constructor(private ngZone: NgZone) { }

  async ngOnInit() {
    await SunmiKeyboardHandler.setKeyHandler({key: HandleableKey.RFID}, async (event) => {
      await this.ngZone.run(async () => {
        if (event.type === KeyEvent.KeyDown) {
          await this.startScan();
        } else {
          await this.stopScan();
        }
      });
    });
  }

  async stopScan() {
    await this.ngZone.run(async () => {
      this.scanning.set(false);
      await SunmiUHF.stopScanning();
    });
  }

  async startScan() {
    await this.ngZone.run(async () => {
      this.epc = "";
      this.scanning.set(true);

      await SunmiUHF.startScanning();
    });
  }

  startCrack() {
    this.cracking = true;
    setTimeout(() => this.crack(), 100);
  }

  stopCrack() {
    this.cracking = false;
  }

  async crack() {
    try {
      await SunmiUHF.setAccessEpcMatch({ epc: this.epc });
      const data = await SunmiUHF.readTag({bank: 'RESERVED', address: 0, length: 1, password: this.code});
      await SunmiUHF.cancelAccessEpcMatch();
      this.cracking = false;
    } catch (error) {
      let value = parseInt(this.code, 16);
      value++;
      this.code = value.toString(16).padStart(8, '0');

      if(this.cracking && this.code != "ffffffff") {
        setTimeout(() => this.crack(), 1);
      }

      if(this.code == "ffffffff") {
        alert("Crack failed");
      }
    }
  }

  @HostListener('window:sunmi_uhf_tag_read', ['$event'])
  async onTagRead(tag: {
    epc: string;
    pc: string;
    frequency: string;
    rrsi: string;
    antenna: number;
    last_updated: number;
    read_count: number;
  }) {
    if (this.epc == '') {
      this.epc = tag.epc;
      await this.stopScan();
    }
  }

  @HostListener('window:sunmi_uhf_read_completed', ['$event'])
  async onInventoryScanCompleted(scan: {
    rate: number;
    tags_read: number;
    details: {
      start_time: number;
      end_time: number;
    };
  }) {
    await this.stopScan();
  }

  async ngOnDestroy() {
    await SunmiKeyboardHandler.removeKeyHandler({key: HandleableKey.RFID});
  }
}
