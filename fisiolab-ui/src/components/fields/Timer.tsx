import React, { useState, useEffect } from "react";
import { HStack, Text, useColorModeValue, Icon } from "@chakra-ui/react";


const HourglassIcon = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}>
    <path d="M5 22h14"/>
    <path d="M5 2h14"/>
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
  </svg>
);

interface TimerProps {
    seconds?: number;
    onExpire?: () => void;
    showLabel?: boolean;
}

export default function Timer({
    seconds = 60,
    onExpire,
    showLabel = true,
}: TimerProps) {
    const [timeLeft, setTimeLeft] = useState(seconds);
    const textColor = useColorModeValue('gray.600', 'gray.400');
    const warningColor = timeLeft <= 10 ? 'red.500' : textColor;

    useEffect(() => {
        if (timeLeft <= 0) {
            onExpire?.();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);


    }, [timeLeft, onExpire]);

    const minutes = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const formattedTime = `${minutes}:${secs.toString().padStart(2, '0')}`;

    return (
        <HStack spacing='6px'>
            <Icon as={HourglassIcon} w='18px' h='18px' color={warningColor} />
            <Text fontSize='sm' color={warningColor} fontWeight='500'>
                {showLabel && 'Código expira en: '}
                {formattedTime}
            </Text>
        </HStack>
    );
}