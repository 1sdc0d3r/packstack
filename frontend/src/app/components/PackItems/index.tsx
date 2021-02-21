import * as React from 'react';

import { WeightUnit } from "enums";
import { PackItem } from "types/item";

import { MessageArea } from "app/components/MessageArea";

import Item from './Item';

import { getCategories } from "lib/utils/categories";
import { getWeightByCategory } from "lib/utils/weight";

import { CategoryGroup } from "styles/common";
import ExpandablePanel from '../ExpandablePanel';
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { DroppableLocation } from './styles';

interface PackItemProps {
    items: PackItem[];
    weightUnit: WeightUnit;
    removeItem: (id: number) => void;
    updateItem: (id: number, field: string, value: string | number | boolean) => void;
    updateItemList: (newPackItems: PackItem[]) => void;
}

const PackItems: React.FC<PackItemProps> = ({ items, removeItem, updateItem, weightUnit, updateItemList }) => {
    const [updateId, setUpdateId] = React.useState<number | null>(null);
    const categories = getCategories(items);
    const weightByCategory = getWeightByCategory(weightUnit, items);

    const renderEmptyList = () => (
        <MessageArea>
            Select items from your inventory to begin<br/> building your packing list.
        </MessageArea>
    );

    const update = (id: number, field: string, value: string | number | boolean) => {
        updateItem(id, field, value);
        setUpdateId(id);
    };

    const onDragEnd = (result: any) => {
        const { source, destination } = result;
        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) { //if we dropped it in our list 
            const sortedItemsInCategory = reorder(items.sort(sortItems).filter(i => i.categoryId.toString() === source.droppableId), source.index, destination.index);
            let allItems: PackItem[] = items.sort(sortItems).filter(i => i.categoryId.toString() != source.droppableId);//remove those old items from the main list
            allItems = allItems.concat(sortedItemsInCategory);
            updateItemList(allItems);
        }
    }

    const reorder = (list: PackItem[], startIndex: number, endIndex: number) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        
        result.forEach((item, index) => {
            item.packItem.sort_order = index;
        })
        return result;
    }

    const sortItems = (a: PackItem, b: PackItem) => {
        return a.packItem && b.packItem ? a.packItem.sort_order - b.packItem.sort_order : 0;
    }

    const renderGroupedItems = () => (
        categories.map(cat => {
            const catItems = items.filter(i => i.categoryId === cat.id);
            const catWeight = weightByCategory.find(c => c.id === cat.id);
            const Header = (
                <>
                    <h3>{cat.name}</h3>
                    <strong>{catWeight!.total.label} {weightUnit}</strong>
                </>
            );
            return (
                <DragDropContext onDragEnd={onDragEnd}>
                <CategoryGroup key={cat.id}>
                    <ExpandablePanel Header={Header}>
                        <Droppable droppableId={cat.id.toString()}>
                            {(provided,snapshot) => 
                                <DroppableLocation isDragging={snapshot.isDraggingOver}>
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                        {catItems.sort(sortItems).map((item, index) => (
                                            <Item key={item.id}
                                                item={item}
                                                updateId={updateId}
                                                removeItem={removeItem}
                                                updateItem={update}
                                                index={index}/>)
                                        )}
                                        {provided.placeholder}
                                    </div>
                                </DroppableLocation>
                            }
                        </Droppable>
                    </ExpandablePanel>
                </CategoryGroup>
                </DragDropContext>

            )
        })
    );

    return (
        <div style={{ marginTop: '8px' }}>
            {items.length ? renderGroupedItems() : renderEmptyList()}
        </div>
    )
};

export default PackItems;