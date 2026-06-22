export type RangeSpringConfig = {
  minLengthRatio: number;
  maxLengthRatio: number;
  compressStrength: number;
  extendStrength: number;
};

export type BlobJointConfigs = {
  neighbor: RangeSpringConfig;
  skipOne: RangeSpringConfig;
  bridge: RangeSpringConfig;
};

export type JointKind = keyof BlobJointConfigs;

export function jointConfigsFromSettings(settings: {
  neighborMinLengthRatio: number;
  neighborMaxLengthRatio: number;
  neighborCompressStrength: number;
  neighborExtendStrength: number;
  skipOneMinLengthRatio: number;
  skipOneMaxLengthRatio: number;
  skipOneCompressStrength: number;
  skipOneExtendStrength: number;
  bridgeMinLengthRatio: number;
  bridgeMaxLengthRatio: number;
  bridgeCompressStrength: number;
  bridgeExtendStrength: number;
}): BlobJointConfigs {
  return {
    neighbor: {
      minLengthRatio: settings.neighborMinLengthRatio,
      maxLengthRatio: settings.neighborMaxLengthRatio,
      compressStrength: settings.neighborCompressStrength,
      extendStrength: settings.neighborExtendStrength,
    },
    skipOne: {
      minLengthRatio: settings.skipOneMinLengthRatio,
      maxLengthRatio: settings.skipOneMaxLengthRatio,
      compressStrength: settings.skipOneCompressStrength,
      extendStrength: settings.skipOneExtendStrength,
    },
    bridge: {
      minLengthRatio: settings.bridgeMinLengthRatio,
      maxLengthRatio: settings.bridgeMaxLengthRatio,
      compressStrength: settings.bridgeCompressStrength,
      extendStrength: settings.bridgeExtendStrength,
    },
  };
}
