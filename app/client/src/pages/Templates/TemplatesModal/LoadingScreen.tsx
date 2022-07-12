import React from "react";
import styled from "styled-components";
import Spinner from "components/ads/Spinner";
import { Text, TextType } from "design-system";
import { Classes } from "components/ads";

const Wrapper = styled.div`
  height: 85vh;

  .${Classes.SPINNER} {
    height: 24px;
    width: 24px;
  }

  justify-content: center;
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

type LoadingScreenProps = {
  text: string;
};

function LoadingScreen(props: LoadingScreenProps) {
  return (
    <Wrapper>
      <Spinner />
      <Text type={TextType.DANGER_HEADING}>{props.text}</Text>
    </Wrapper>
  );
}

export default LoadingScreen;
