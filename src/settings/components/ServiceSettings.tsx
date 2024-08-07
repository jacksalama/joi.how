import styled from 'styled-components';
import { SettingsTile, TabBar } from '../../common';
import { E621Search } from '../../e621';
import { useState } from 'react';
import { LocalFileImport } from '../../localfile';

const TabSettingsTile = styled(SettingsTile)`
  & > legend {
    background: var(--card-background);
    padding: 0;
  }
`;

enum Tab {
  E621 = 'e621',
  Booru = 'booru',
  Local = 'local',
}

export const ServiceSettings = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.E621);

  return (
    <TabSettingsTile
      label={
        <TabBar
          tabs={[
            { id: Tab.E621, content: 'e621' },
            { id: Tab.Booru, content: 'Booru' },
            { id: Tab.Local, content: 'Local' },
          ]}
          current={activeTab}
          onChange={id => setActiveTab(id as Tab)}
        />
      }
    >
      {activeTab === 'e621' && <E621Search />}
      {activeTab === 'booru' && <div>TODO!</div>}
      {activeTab === 'local' && <LocalFileImport />}
    </TabSettingsTile>
  );
};
