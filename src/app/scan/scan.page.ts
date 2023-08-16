import {Component, HostListener, NgZone, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {HandleableKey, KeyEvent, SunmiKeyboardHandler} from "@kduma-autoid/capacitor-sunmi-keyboard-handler";
import {SunmiUHF} from "@kduma-autoid/capacitor-sunmi-uhf";
// @ts-ignore
import {valueOf as EpcTdsValueOf} from "epc-tds";

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ScanPage implements OnInit, OnDestroy {

  newTodo = 'test'
  model = signal<string>('')
  tags = signal<string[]>([]);
  tagValues = signal<{epc: string, uri: string, type: string, barcode: string, serial: string}[]>([]);
  reads = signal<number>(0);
  rate = signal<number>(0);
  scanning = signal<boolean>(false);

  constructor(private ngZone: NgZone) { }

  async ngOnInit() {
    this.model.set((await SunmiUHF.getScanModel()).model);

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
      this.tags.set([]);
      this.tagValues.set([]);
      this.reads.set(0);
      this.rate.set(0);

      this.scanning.set(true);

      await SunmiUHF.startScanning();
    });
  }

  @HostListener('window:sunmi_uhf_tag_read', ['$event'])
  onTagRead(tag: {
    epc: string;
    pc: string;
    frequency: string;
    rrsi: string;
    antenna: number;
    last_updated: number;
    read_count: number;
  }) {
    this.reads.update(value => ++value);

    const epc = tag.epc;

    if (this.tags().indexOf(epc) === -1) {
      this.tags.mutate(values => values.push(epc));

      try {
        const val = EpcTdsValueOf(epc);
        this.tagValues.mutate(values => values.push({
          epc: epc,
          uri: val.toTagURI(),
          type: val.getType(),
          barcode: val.toBarcode(),
          serial: val.getSerial()
        }));
      } catch (e) {
        this.tagValues.mutate(values => values.push({
          epc: epc,
          type: 'UNKNOWN',
          uri: 'UNKNOWN',
          barcode: 'UNKNOWN',
          serial: 'UNKNOWN'
        }));
      }

    }
  }

  @HostListener('window:sunmi_uhf_read_completed', ['$event'])
  onInventoryScanCompleted(scan: {
    rate: number;
    tags_read: number;
    details: {
      start_time: number;
      end_time: number;
    };
  }) {
    this.rate.set(scan.rate);
  }

  async ngOnDestroy() {
    await SunmiKeyboardHandler.removeKeyHandler({key: HandleableKey.RFID});
    await SunmiUHF.clearTagReadCallback();
    await SunmiUHF.clearInventoryScanCompletedCallback();
  }

}
