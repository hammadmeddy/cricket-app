import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  fairCoinFace,
  fairSpinExtraFullTurns,
  tossWinnerFromCallAndOutcome,
  type TossCoinFace,
} from '../lib/tossCoin';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { spacing } from '../theme/spacing';
import AppText from './ui/AppText';
import Button from './ui/Button';

export type { TossCoinFace };

type Props = {
  visible: boolean;
  callFace: TossCoinFace;
  teamAName: string;
  teamBName: string;
  onRequestClose: () => void;
  onSettled: (payload: { outcome: TossCoinFace; winnerSide: 'A' | 'B' }) => void;
};

const COIN_MAX_ROT = 4200;

export default function TossCeremonyModal({
  visible,
  callFace,
  teamAName,
  teamBName,
  onRequestClose,
  onSettled,
}: Props) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const coinScale = useRef(new Animated.Value(0.4)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(28)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const [allowDismiss, setAllowDismiss] = useState(false);
  /** After the flip, we swap to a 2D coin so HEADS/TAILS always reads correctly (3D + tilt can mirror the wrong face). */
  const [landedFace, setLandedFace] = useState<TossCoinFace | null>(null);
  const [displayOutcome, setDisplayOutcome] = useState<TossCoinFace | null>(null);
  const [displayWinner, setDisplayWinner] = useState<'A' | 'B' | null>(null);
  const runGeneration = useRef(0);
  const staticPop = useRef(new Animated.Value(0)).current;

  const coinSpinStyle = {
    transform: [
      { perspective: 1400 },
      {
        rotateX: rotateAnim.interpolate({
          inputRange: [0, COIN_MAX_ROT],
          outputRange: ['0deg', `${COIN_MAX_ROT}deg`],
        }),
      },
    ],
  };

  const coinMotionStyle = {
    transform: [
      {
        rotateZ: tilt.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ['-8deg', '0deg', '8deg'],
        }),
      },
      { scale: coinScale },
    ],
  };

  useEffect(() => {
    if (!visible) {
      setAllowDismiss(false);
      setLandedFace(null);
      setDisplayOutcome(null);
      setDisplayWinner(null);
      staticPop.setValue(0);
      rotateAnim.setValue(0);
      coinScale.setValue(0.4);
      titleOpacity.setValue(0);
      titleTranslate.setValue(28);
      tilt.setValue(0);
      resultOpacity.setValue(0);
      return;
    }

    const myRun = ++runGeneration.current;
    let cancelled = false;

    const stopIfStale = () => cancelled || myRun !== runGeneration.current;

    setAllowDismiss(false);
    setLandedFace(null);
    setDisplayOutcome(null);
    setDisplayWinner(null);
    staticPop.setValue(0);

    const outcome: TossCoinFace = fairCoinFace();
    const winnerSide: 'A' | 'B' = tossWinnerFromCallAndOutcome(callFace, outcome, 'A');
    const k = fairSpinExtraFullTurns();
    const endRotation = k * 360 + (outcome === 'heads' ? 0 : 180);

    const introComposite = Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslate, {
        toValue: 0,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(coinScale, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]);

    const wobbleComposite = Animated.sequence([
      Animated.timing(tilt, {
        toValue: 1,
        duration: 120,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(tilt, {
        toValue: -1,
        duration: 140,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(tilt, {
        toValue: 0.55,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tilt, {
        toValue: -0.4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tilt, {
        toValue: 0,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    const flipRotate = Animated.timing(rotateAnim, {
      toValue: endRotation,
      duration: 3000,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    introComposite.start(({ finished }) => {
      if (!finished || stopIfStale()) {
        return;
      }
      wobbleComposite.start(({ finished: wDone }) => {
        if (!wDone || stopIfStale()) {
          return;
        }
        flipRotate.start(({ finished: fDone }) => {
          if (!fDone || stopIfStale()) {
            return;
          }
          rotateAnim.setValue(endRotation);
          onSettled({ outcome, winnerSide });
          const impact = Animated.sequence([
            Animated.spring(coinScale, {
              toValue: 1.1,
              friction: 6,
              tension: 200,
              useNativeDriver: true,
            }),
            Animated.spring(coinScale, {
              toValue: 1,
              friction: 8,
              tension: 120,
              useNativeDriver: true,
            }),
          ]);
          impact.start(() => {
            if (stopIfStale()) {
              return;
            }
            setLandedFace(outcome);
            setDisplayOutcome(outcome);
            setDisplayWinner(winnerSide);
            staticPop.setValue(0);
            Animated.spring(staticPop, {
              toValue: 1,
              friction: 7,
              tension: 80,
              useNativeDriver: true,
            }).start();
            Animated.timing(resultOpacity, {
              toValue: 1,
              duration: 450,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start(() => {
              if (!stopIfStale()) {
                setAllowDismiss(true);
              }
            });
          });
        });
      });
    });

    return () => {
      cancelled = true;
      runGeneration.current += 1;
      introComposite.stop();
      wobbleComposite.stop();
      flipRotate.stop();
      rotateAnim.stopAnimation();
      coinScale.stopAnimation();
      titleOpacity.stopAnimation();
      titleTranslate.stopAnimation();
      tilt.stopAnimation();
      resultOpacity.stopAnimation();
      staticPop.stopAnimation();
    };
  }, [
    visible,
    callFace,
    rotateAnim,
    coinScale,
    titleOpacity,
    titleTranslate,
    tilt,
    resultOpacity,
    staticPop,
    onSettled,
  ]);

  const callerName = teamAName;
  const winnerName =
    displayWinner === 'A' ? teamAName : displayWinner === 'B' ? teamBName : '';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        if (allowDismiss) {
          onRequestClose();
        }
      }}
    >
      <View style={styles.root}>
        <View style={styles.vignette} />

        {!allowDismiss ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {}}
            accessibilityLabel="Toss in progress"
          />
        ) : null}

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.titleBlock,
              { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] },
            ]}
          >
            <View style={styles.titleIconWrap}>
              <Ionicons name="trophy" size={28} color={colors.warning} />
            </View>
            <AppText variant="title1" style={styles.title}>
              The toss
            </AppText>
            <AppText variant="callout" style={styles.subtitle}>
              <Text style={styles.teamAEmph}>{callerName}</Text>
              <Text style={styles.subMuted}> (Team A) calls </Text>
              <Text style={styles.callEmph}>{callFace}</Text>
              <Text style={styles.subMuted}>. Fair coin — every ceremony is a fresh flip.</Text>
            </AppText>
          </Animated.View>

          <View style={styles.coinArena}>
            {landedFace ? (
              <Animated.View
                style={{
                  opacity: staticPop,
                  transform: [
                    {
                      scale: staticPop.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.88, 1],
                      }),
                    },
                  ],
                }}
              >
                <StaticLandedCoin face={landedFace} />
              </Animated.View>
            ) : (
              <>
                <Animated.View style={coinMotionStyle}>
                  <Animated.View style={[styles.coin3d, coinSpinStyle]}>
                    <View style={[styles.coinFace, styles.coinFaceHeads]}>
                      <AppText style={styles.coinWord}>HEADS</AppText>
                      <AppText variant="caption" style={styles.coinFaceHint}>
                        Sun side
                      </AppText>
                    </View>
                    <View style={[styles.coinFace, styles.coinFaceTails]}>
                      <View style={styles.coinBackCorrect}>
                        <AppText style={styles.coinWordTails}>TAILS</AppText>
                        <AppText variant="caption" style={styles.coinFaceHintTails}>
                          Moon side
                        </AppText>
                      </View>
                    </View>
                  </Animated.View>
                </Animated.View>
              </>
            )}
          </View>

          <Animated.View style={[styles.resultCard, { opacity: resultOpacity }]}>
            {displayOutcome && displayWinner ? (
              <>
                <View style={styles.resultBadge}>
                  <AppText variant="caption" style={styles.resultBadgeText}>
                    Official result
                  </AppText>
                </View>
                <AppText style={styles.resultFace}>
                  {displayOutcome === 'heads' ? 'HEADS' : 'TAILS'}
                </AppText>
                <AppText variant="title3" style={styles.resultWinner}>
                  {winnerName} wins the toss
                </AppText>
              </>
            ) : null}
          </Animated.View>

          {allowDismiss ? (
            <Button
              label="Continue"
              onPress={onRequestClose}
              style={styles.continueBtn}
            />
          ) : (
            <>
              <AppText variant="caption" style={styles.waitHint}>
                Coin in the air…
              </AppText>
              <AppText variant="caption" style={styles.randomNote}>
                Hang tight — this only takes a few seconds.
              </AppText>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function StaticLandedCoin({ face }: { face: TossCoinFace }) {
  const heads = face === 'heads';
  return (
    <View
      style={styles.staticWrap}
      accessibilityRole="image"
      accessibilityLabel={heads ? 'Heads' : 'Tails'}
    >
      <View style={[styles.staticCoin, heads ? styles.staticCoinHeads : styles.staticCoinTails]}>
        {heads ? (
          <Ionicons name="sunny" size={40} color="#1d4d32" style={styles.staticGlyph} />
        ) : (
          <Ionicons name="moon" size={40} color="#caf0f8" style={styles.staticGlyph} />
        )}
        <Text style={heads ? styles.staticTitleHeads : styles.staticTitleTails}>
          {heads ? 'HEADS' : 'TAILS'}
        </Text>
        <Text style={heads ? styles.staticTagHeads : styles.staticTagTails}>
          {heads ? 'Sun side' : 'Moon side'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  content: {
    alignItems: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  titleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 23,
  },
  teamAEmph: {
    color: colors.text,
    fontWeight: '700',
  },
  subMuted: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  callEmph: {
    color: colors.accent,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  coinArena: {
    width: 280,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  staticWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  staticCoin: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  staticCoinHeads: {
    backgroundColor: '#f2ebd8',
  },
  staticCoinTails: {
    backgroundColor: '#2a3540',
  },
  staticGlyph: {
    marginBottom: spacing.sm,
  },
  staticTitleHeads: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f1f16',
    letterSpacing: 4,
  },
  staticTitleTails: {
    fontSize: 26,
    fontWeight: '900',
    color: '#f8fbff',
    letterSpacing: 4,
  },
  staticTagHeads: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15, 31, 22, 0.55)',
  },
  staticTagTails: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(248, 251, 255, 0.65)',
  },
  coin3d: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinFace: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  coinFaceHeads: {
    backgroundColor: '#ebe4cf',
  },
  coinFaceTails: {
    backgroundColor: '#3d4a56',
    transform: [{ rotateX: '180deg' }],
  },
  /** Counter-rotate so TAILS is upright when the back face faces the viewer (rotateX 180 mirrors text). */
  coinBackCorrect: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotateZ: '180deg' }],
  },
  coinWord: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a2a22',
    letterSpacing: 2,
  },
  coinWordTails: {
    fontSize: 22,
    fontWeight: '900',
    color: '#e8eef4',
    letterSpacing: 2,
  },
  coinFaceHint: {
    marginTop: spacing.sm,
    color: 'rgba(26, 42, 34, 0.65)',
    fontWeight: '600',
  },
  coinFaceHintTails: {
    marginTop: spacing.sm,
    color: 'rgba(232, 238, 244, 0.75)',
    fontWeight: '600',
  },
  resultCard: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 340,
    width: '100%',
  },
  resultBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.sm,
  },
  resultBadgeText: {
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resultFace: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.warning,
    letterSpacing: 3,
    marginBottom: spacing.xs,
  },
  resultWinner: {
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  continueBtn: {
    alignSelf: 'stretch',
    maxWidth: 340,
  },
  waitHint: {
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  randomNote: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 18,
  },
});
