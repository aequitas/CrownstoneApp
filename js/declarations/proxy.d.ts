interface BluenetPromiseWrapperProtocol {
  clearTrackedBeacons()                                               : Promise< void >,
  commandFactoryReset()                                               : Promise< void >,
  connect(handle: string, referenceId: string, highPriority?: boolean): Promise< void >,
  disconnectCommand()                                                 : Promise< void >,
  getMACAddress()                               : Promise< string >,
  getFirmwareVersion()                          : Promise< string >,
  getBootloaderVersion()                        : Promise< string >,
  getHardwareVersion()                          : Promise< string >,
  finalizeFingerprint(sphereId: string, locationId: string): Promise< void >,
  isReady()                                     : Promise< void >,
  isPeripheralReady()                           : Promise< void >,
  keepAlive()                                   : Promise< void >,
  keepAliveState(changeState : boolean, state : number, timeout: number): Promise< void >,
  phoneDisconnect()                             : Promise< void >,
  toggleSwitchState(stateForOn)                 : Promise< number >,
  setupCrownstone(dataObject)                   : Promise< void >,
  requestLocation()                             : Promise< locationType >,
  recover(handle: string)                       : Promise< void >,
  clearFingerprintsPromise()                    : Promise< void >,
  setKeySets(keySets)                           : Promise< void >,

  // Mesh
  meshKeepAlive()                                                 : Promise< void >,
  meshKeepAliveState(timeout: number, stoneKeepAlivePackets: any) : Promise< void >,
  multiSwitch(arrayOfStoneSwitchPackets: any[])                   : Promise< void >,

  // DFU
  putInDFU()                                    : Promise< void >,
  setupPutInDFU()                               : Promise< void >,
  performDFU(handle : string, uri: string )     : Promise< void >,
  setupFactoryReset()                           : Promise< void >,
  bootloaderToNormalMode( handle : string )     : Promise< void >,

  // new
  getErrors()                                   : Promise< errorData >,
  clearErrors(clearErrorJSON : clearErrorData)  : Promise< void >,
  restartCrownstone()                           : Promise< void >,
  setTime(time : number)                        : Promise< void >,
  meshSetTime(time : number)                    : Promise< void >,
  getTime()                                     : Promise< number >, // timestamp in seconds since epoch

  addSchedule(data : bridgeScheduleEntry)       : Promise< void >,
  setSchedule(data : bridgeScheduleEntry)       : Promise< void >,
  clearSchedule(scheduleEntryIndex : number)    : Promise< void >,
  getAvailableScheduleEntryIndex()              : Promise< number >,
  getSchedules()                                : Promise< [bridgeScheduleEntry] >,

  getSwitchState()                              : Promise< number >,
  lockSwitch(lock : Boolean)                    : Promise< void >,
  allowDimming(allow: Boolean)                  : Promise< void >,
  setSwitchCraft(state: Boolean)                : Promise< void >,

  sendNoOp()                                    : Promise< void >,
  sendMeshNoOp()                                : Promise< void >,
  setMeshChannel(channel)                       : Promise< void >,

  getTrackingState()                            : Promise< trackingState >,
  isDevelopmentEnvironment()                    : Promise< boolean >,

  broadcastSwitch(referenceId, stoneId, switchState):Promise< void >,
}


type deviceType = 'undefined' | 'plug' | 'guidestone' | 'builtin' | 'crownstoneUSB'

interface crownstoneServiceData {
  opCode?                   : number, // unencrypted type (optional)
  dataType?                 : number, // encrypted type (optional)
  stateOfExternalCrownstone : boolean,
  hasError                  : boolean,
  setupMode                 : boolean,
  crownstoneId              : number, // [0 .. 255]
  switchState               : number, // [0.0 .. 1.0]
  flagsBitmask?             : number, // bitmask (optional)
  temperature               : number, // °C
  powerFactor               : number, // [-1.0 .. 1.0] __not 0__ (default 1.0)
  powerUsageReal            : number, // W
  powerUsageApparent        : number, // VA
  accumulatedEnergy         : number, // J
  timestamp                 : number, // reconstructed timestamp, -1 if not available, uint16 counter when time is not set

  // bitmask flags
  dimmingAvailable          : boolean,
  dimmingAllowed            : boolean,
  switchLocked              : boolean,
  timeSet                   : boolean,
  switchCraftEnabled        : boolean,

  deviceType                : deviceType,
  rssiOfExternalCrownstone  : number, // Set to 0 when not external service data.
  errorMode                 : boolean, // True when service data is of type error.
  errors                    : errorData, // Has to be correct when errorMode is true.
  uniqueElement             : number // Partial timestamp, counter, etc. Is this required?
}


interface crownstoneAdvertisement {
  handle              : string,
  name                : string,
  rssi                : number,
  referenceId         : string, // Only required when advertisement is validated and crownstone is in normal mode?
  isCrownstoneFamily  : boolean, // Only known when there is serviceData ?
  isInDFUMode         : boolean,
  serviceUUID         : string, // Is this required?
  serviceData         : crownstoneServiceData // Can be missing sometimes?
}


interface ibeaconPackage {
  id    : string,
  uuid  : string,
  major : string,
  minor : string,
  distance  : number,
  rssi  : number,
  referenceId  : string,
}


// expected response from getErrors
interface errorData {
  overCurrent       : boolean
  overCurrentDimmer : boolean
  temperatureChip   : boolean
  temperatureDimmer : boolean
  dimmerOnFailure   : boolean
  dimmerOffFailure  : boolean
  bitMask           : number // For debug
}


interface clearErrorData {
  overCurrent       : boolean
  overCurrentDimmer : boolean
  temperatureChip   : boolean
  temperatureDimmer : boolean
  dimmerOnFailure   : boolean
  dimmerOffFailure  : boolean
}


interface locationType {
  latitude:  number,
  longitude: number,
}


interface trackingState {
  isMonitoring: boolean, // ??
  isRanging:    boolean, // ??
}

interface nearestStone  {
  name      : string,
  handle    : string,
  rssi      : number,
  setupMode : boolean
  dfuMode   : boolean
  verified  : boolean
}

interface keySet  {
  adminKey:    string,
  memberKey:   string,
  guestKey:    string,
  referenceId: string,
  iBeaconUuid: string,
}
